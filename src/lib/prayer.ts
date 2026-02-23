import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes, Qibla } from 'adhan';

export interface LocationState {
  latitude: number;
  longitude: number;
  city?: string;
}

export function getPrayerTimes(date: Date, location: LocationState) {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = CalculationMethod.MuslimWorldLeague();
  const prayerTimes = new PrayerTimes(coords, date, params);
  const sunnahTimes = new SunnahTimes(prayerTimes);
  
  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    imsak: new Date(prayerTimes.fajr.getTime() - 10 * 60 * 1000), // 10 mins before Fajr
    midnight: sunnahTimes.middleOfTheNight,
    lastThird: sunnahTimes.lastThirdOfTheNight,
  };
}

export function getQibla(location: LocationState) {
  const coords = new Coordinates(location.latitude, location.longitude);
  return Qibla(coords);
}
