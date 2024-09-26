function UTIL_UTC_Time() {
	return DateTime.now().UnixTimestampMillis / 1000;
}

export = UTIL_UTC_Time;
