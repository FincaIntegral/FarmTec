package com.ganadosmart.app

import platform.Foundation.NSDate
import platform.Foundation.NSDateFormatter
import platform.Foundation.NSISO8601DateFormatter
import platform.Foundation.NSTimeZone
import platform.Foundation.localTimeZone

actual fun hoyIso(): String {
    val formatter = NSDateFormatter().apply {
        dateFormat = "yyyy-MM-dd"
        timeZone = NSTimeZone.localTimeZone
    }
    return formatter.stringFromDate(NSDate())
}

actual fun ahoraIso(): String = NSISO8601DateFormatter().stringFromDate(NSDate())
