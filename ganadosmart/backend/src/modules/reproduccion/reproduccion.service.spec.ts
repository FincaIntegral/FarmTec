import { BadRequestException, ConflictException } from '@nestjs/common';
import { CategoriaAnimal } from '../../shared/enums/categoria-animal.enum';
import { EstadoAnimal } from '../../shared/enums/estado-animal.enum';
import { EstadoReproduccion } from '../../shared/enums/estado-reproduccion.enum';
import { SexoAnimal } from '../../shared/enums/sexo-animal.enum';
import { TipoReproduccion } from '../../shared/enums/tipo-reproduccion.enum';
import { Animal } from '../animal/entities/animal.entity';
import { Reproduccion } from './entities/reproduccion.entity';
import { ReproduccionRepository } from './reproduccion.repository';
import { ReproduccionService } from './reproduccion.service';

const FINCA = 'finca-1';

const toro = {
  id: 'toro-1',
  codigo: 'TORO-001',
  sexo: SexoAnimal.MACHO,
  categoria: CategoriaAnimal.TORO,
  estado: EstadoAnimal.ACTIVO,
} as Animal;

const vaca = {
  id: 'vaca-1',
  codigo: 'VACA-001',
  sexo: SexoAnimal.HEMBRA,
  categoria: CategoriaAnimal.VACA,
  estado: EstadoAnimal.ACTIVO,
} as Animal;

const reproEnCurso = {
  id: 'repro-1',
  fincaId: FINCA,
  toroId: toro.id,
  vacaId: vaca.id,
  tipo: TipoReproduccion.MONTA_NATURAL,
  fecha: '2026-01-01',
  estado: EstadoReproduccion.EN_CURSO,
  becerroResultanteId: null,
} as Reproduccion;

describe('ReproduccionService', () => {
  let repo: jest.Mocked<ReproduccionRepository>;
  let service: ReproduccionService;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findAllByFinca: jest.fn(),
      findAnimalById: jest.fn(),
      existeEnCursoParaVaca: jest.fn(),
      existeCodigoAnimal: jest.fn(),
      create: jest.fn(),
      marcarFallido: jest.fn(),
      confirmarPartoExitoso: jest.fn(),
      vacasEnGestacion: jest.fn(),
      conteoReproduccion: jest.fn(),
    } as unknown as jest.Mocked<ReproduccionRepository>;
    service = new ReproduccionService(repo);
  });

  describe('create', () => {
    const dto = {
      toroId: toro.id,
      vacaId: vaca.id,
      tipo: TipoReproduccion.MONTA_NATURAL,
      fecha: '2026-01-01',
    };

    it('registra en_curso con fecha probable de parto a +283 días', async () => {
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toro : vaca),
      );
      repo.existeEnCursoParaVaca.mockResolvedValue(false);
      repo.create.mockImplementation((data) =>
        Promise.resolve({ ...reproEnCurso, ...data } as Reproduccion),
      );

      const result = await service.create(dto, FINCA);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fincaId: FINCA,
          fechaProbableParto: '2026-10-11', // 2026-01-01 + 283 días
        }),
      );
      expect(result.estado).toBe(EstadoReproduccion.EN_CURSO);
    });

    it('rechaza toro que no es macho de la finca', async () => {
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? vaca : vaca),
      );
      await expect(service.create(dto, FINCA)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza animales muertos o vendidos', async () => {
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(
          id === toro.id ? toro : ({ ...vaca, estado: EstadoAnimal.MUERTO } as Animal),
        ),
      );
      await expect(service.create(dto, FINCA)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('409 si la vaca ya tiene un evento en curso', async () => {
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toro : vaca),
      );
      repo.existeEnCursoParaVaca.mockResolvedValue(true);
      await expect(service.create(dto, FINCA)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rechaza si el toro es un becerro', async () => {
      const toroBecerro = { ...toro, categoria: CategoriaAnimal.BECERRO } as Animal;
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toroBecerro : vaca),
      );
      await expect(service.create(dto, FINCA)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza si la vaca es una becerra', async () => {
      const vacaBecerra = { ...vaca, categoria: CategoriaAnimal.BECERRO } as Animal;
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toro : vacaBecerra),
      );
      await expect(service.create(dto, FINCA)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rechaza fecha futura', async () => {
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toro : vaca),
      );
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      await expect(
        service.create(
          { ...dto, fecha: manana.toISOString().slice(0, 10) },
          FINCA,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza toro muerto en monta natural', async () => {
      const toroMuerto = { ...toro, estado: EstadoAnimal.MUERTO } as Animal;
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toroMuerto : vaca),
      );
      await expect(
        service.create({ ...dto, tipo: TipoReproduccion.MONTA_NATURAL }, FINCA),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('permite toro muerto o vendido en inseminación (semen ya registrado)', async () => {
      const toroVendido = { ...toro, estado: EstadoAnimal.VENDIDO } as Animal;
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toroVendido : vaca),
      );
      repo.existeEnCursoParaVaca.mockResolvedValue(false);
      repo.create.mockImplementation((data) =>
        Promise.resolve({ ...reproEnCurso, ...data } as Reproduccion),
      );

      const result = await service.create(
        { ...dto, tipo: TipoReproduccion.INSEMINACION },
        FINCA,
      );
      expect(result.estado).toBe(EstadoReproduccion.EN_CURSO);
    });

    it('rechaza vaca muerta incluso en inseminación', async () => {
      const vacaMuerta = { ...vaca, estado: EstadoAnimal.MUERTO } as Animal;
      repo.findAnimalById.mockImplementation((id) =>
        Promise.resolve(id === toro.id ? toro : vacaMuerta),
      );
      await expect(
        service.create({ ...dto, tipo: TipoReproduccion.INSEMINACION }, FINCA),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    describe('pajilla externa (inseminación sin toro propio)', () => {
      const dtoPajilla = {
        vacaId: vaca.id,
        tipo: TipoReproduccion.INSEMINACION,
        fecha: '2026-01-01',
        pajillaProveedor: 'ABS Genética',
        pajillaRaza: 'Angus',
      };

      it('inseminacion con pajilla (sin toroId) se registra correctamente', async () => {
        repo.findAnimalById.mockResolvedValue(vaca);
        repo.existeEnCursoParaVaca.mockResolvedValue(false);
        repo.create.mockImplementation((data) =>
          Promise.resolve({ ...reproEnCurso, ...data } as Reproduccion),
        );

        const result = await service.create(dtoPajilla, FINCA);

        expect(repo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            toroId: null,
            pajillaProveedor: 'ABS Genética',
            pajillaRaza: 'Angus',
          }),
        );
        expect(result.estado).toBe(EstadoReproduccion.EN_CURSO);
        // sin toroId no se busca animal-toro, solo la vaca
        expect(repo.findAnimalById).toHaveBeenCalledTimes(1);
      });

      it('rechaza monta_natural con pajilla', async () => {
        await expect(
          service.create(
            { ...dtoPajilla, tipo: TipoReproduccion.MONTA_NATURAL },
            FINCA,
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.create).not.toHaveBeenCalled();
      });

      it('rechaza inseminacion con toroId Y pajilla al mismo tiempo', async () => {
        await expect(
          service.create({ ...dtoPajilla, toroId: toro.id }, FINCA),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.create).not.toHaveBeenCalled();
      });

      it('rechaza inseminacion sin toroId y sin pajilla', async () => {
        await expect(
          service.create(
            { vacaId: vaca.id, tipo: TipoReproduccion.INSEMINACION, fecha: '2026-01-01' },
            FINCA,
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.create).not.toHaveBeenCalled();
      });

      it('rechaza pajilla incompleta (solo proveedor, sin raza)', async () => {
        await expect(
          service.create(
            { ...dtoPajilla, pajillaRaza: undefined },
            FINCA,
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(repo.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('confirmarParto', () => {
    const becerro = { sexo: SexoAnimal.MACHO, codigo: 'BEC-001' };

    it('exitoso delega la transacción de genealogía al repositorio', async () => {
      repo.findById.mockResolvedValue(reproEnCurso);
      repo.existeCodigoAnimal.mockResolvedValue(false);
      repo.confirmarPartoExitoso.mockResolvedValue({
        ...reproEnCurso,
        estado: EstadoReproduccion.EXITOSO,
        becerroResultanteId: 'becerro-1',
      } as Reproduccion);

      const result = await service.confirmarParto(
        reproEnCurso.id,
        FINCA,
        { resultado: 'exitoso', becerro },
        'user-1',
      );

      expect(repo.confirmarPartoExitoso).toHaveBeenCalledWith(
        reproEnCurso,
        becerro,
        'user-1',
      );
      expect(result.becerroResultanteId).toBe('becerro-1');
    });

    it('exitoso sin becerro en el body → 400', async () => {
      repo.findById.mockResolvedValue(reproEnCurso);
      await expect(
        service.confirmarParto(reproEnCurso.id, FINCA, { resultado: 'exitoso' }, 'u'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('exitoso con código de becerro duplicado → 400', async () => {
      repo.findById.mockResolvedValue(reproEnCurso);
      repo.existeCodigoAnimal.mockResolvedValue(true);
      await expect(
        service.confirmarParto(
          reproEnCurso.id,
          FINCA,
          { resultado: 'exitoso', becerro },
          'u',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('fallido solo cambia el estado, sin crear becerro', async () => {
      repo.findById.mockResolvedValue(reproEnCurso);
      repo.marcarFallido.mockResolvedValue({
        ...reproEnCurso,
        estado: EstadoReproduccion.FALLIDO,
      } as Reproduccion);

      const result = await service.confirmarParto(
        reproEnCurso.id,
        FINCA,
        { resultado: 'fallido' },
        'u',
      );

      expect(result.estado).toBe(EstadoReproduccion.FALLIDO);
      expect(repo.confirmarPartoExitoso).not.toHaveBeenCalled();
    });

    it('409 si la reproducción ya fue resuelta', async () => {
      repo.findById.mockResolvedValue({
        ...reproEnCurso,
        estado: EstadoReproduccion.EXITOSO,
      } as Reproduccion);
      await expect(
        service.confirmarParto(reproEnCurso.id, FINCA, { resultado: 'fallido' }, 'u'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
