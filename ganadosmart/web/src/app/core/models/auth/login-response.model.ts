import { UsuarioDetailModel } from '../usuario';

export interface LoginResponseModel {
  accessToken: string;
  usuario: UsuarioDetailModel;
}
