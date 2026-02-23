/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Settings as SettingsIcon, 
  MapPin, 
  Moon, 
  Sun, 
  Bell, 
  BellOff,
  ChevronRight,
  Volume2
} from 'lucide-react';
import { format, addDays, startOfToday, isAfter, isBefore, differenceInSeconds } from 'date-fns';
import { getPrayerTimes, LocationState } from './lib/prayer';
import { cn } from './lib/utils';

// Types
type Screen = 'home' | 'times' | 'calendar' | 'settings';

// Components
const ScreenWrapper = ({ children, active }: { children: React.ReactNode; active: boolean; key?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className={cn("flex-1 overflow-y-auto pb-24 px-6 pt-8", !active && "hidden")}
  >
    {children}
  </motion.div>
);

// Constants
const RAMADAN_START_2026 = new Date(2026, 1, 18); // Feb 18, 2026

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [now, setNow] = useState(new Date());
  const [location, setLocation] = useState<LocationState>({
    latitude: 23.8103, // Default to Dhaka
    longitude: 90.4125,
    city: 'Dhaka'
  });
  const [adhanEnabled, setAdhanEnabled] = useState(true);
  const [isAdhanPlaying, setIsAdhanPlaying] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: 'Current Location'
        });
      });
    }
  }, []);

  const prayerTimes = useMemo(() => getPrayerTimes(now, location), [now, location]);

  const nextEvent = useMemo(() => {
    const { imsak, maghrib } = prayerTimes;
    
    // If it's before imsak, next is imsak (Sehri ends)
    if (isBefore(now, imsak)) {
      return { name: 'Sehri Ends', time: imsak, type: 'sehri' };
    }
    // If it's after imsak but before maghrib, next is maghrib (Iftar)
    if (isBefore(now, maghrib)) {
      return { name: 'Iftar', time: maghrib, type: 'iftar' };
    }
    // If it's after maghrib, next is tomorrow's imsak
    const tomorrowTimes = getPrayerTimes(addDays(now, 1), location);
    return { name: 'Sehri Ends', time: tomorrowTimes.imsak, type: 'sehri' };
  }, [now, prayerTimes, location]);

  const countdownSeconds = Math.max(0, differenceInSeconds(nextEvent.time, now));
  const hours = Math.floor(countdownSeconds / 3600);
  const minutes = Math.floor((countdownSeconds % 3600) / 60);
  const seconds = countdownSeconds % 60;

  // Adhan logic
  useEffect(() => {
    if (countdownSeconds === 0 && adhanEnabled && !isAdhanPlaying) {
      playAdhan();
    }
  }, [countdownSeconds, adhanEnabled]);

  const playAdhan = () => {
    setIsAdhanPlaying(true);
    const audio = new Audio('https://www.islamcan.com/audio/adhan/azan1.mp3');
    audio.play();
    audio.onended = () => setIsAdhanPlaying(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F5F5F5] text-[#141414] overflow-hidden relative shadow-2xl">
      {/* Header */}
      <header className="px-6 pt-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-zinc-400" />
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">{location.city}</span>
        </div>
        <button 
          onClick={() => setAdhanEnabled(!adhanEnabled)}
          className="p-2 rounded-full bg-white border border-zinc-200 shadow-sm"
        >
          {adhanEnabled ? <Bell size={18} /> : <BellOff size={18} className="text-zinc-400" />}
        </button>
      </header>

      <AnimatePresence mode="wait">
        {activeScreen === 'home' && (
          <ScreenWrapper active={true} key="home">
            <div className="space-y-8">
              <div className="space-y-1">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Next Event</h2>
                <h1 className="text-4xl font-bold tracking-tight">{nextEvent.name}</h1>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 flex flex-col items-center justify-center space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-mono font-bold tracking-tighter">
                    {hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-2xl font-mono font-medium text-zinc-300">:</span>
                  <span className="text-7xl font-mono font-bold tracking-tighter">
                    {minutes.toString().padStart(2, '0')}
                  </span>
                  <span className="text-2xl font-mono font-medium text-zinc-300">:</span>
                  <span className="text-7xl font-mono font-bold tracking-tighter">
                    {seconds.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  <span>Hours</span>
                  <span>Minutes</span>
                  <span>Seconds</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 text-white rounded-2xl p-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <Sun size={16} className="text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sehri</span>
                  </div>
                  <div className="text-2xl font-mono font-medium">
                    {format(prayerTimes.imsak, 'HH:mm')}
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 space-y-2 border border-zinc-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <Moon size={16} className="text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Iftar</span>
                  </div>
                  <div className="text-2xl font-mono font-medium">
                    {format(prayerTimes.maghrib, 'HH:mm')}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center">
                    <Clock size={20} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Current Time</p>
                    <p className="text-xl font-mono font-medium">{format(now, 'HH:mm:ss')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{format(now, 'EEEE')}</p>
                  <p className="text-sm font-medium">{format(now, 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>
          </ScreenWrapper>
        )}

        {activeScreen === 'times' && (
          <ScreenWrapper active={true} key="times">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight">Prayer Times</h1>
              <div className="space-y-2">
                {[
                  { name: 'Fajr', time: prayerTimes.fajr, icon: <Sun size={18} /> },
                  { name: 'Sunrise', time: prayerTimes.sunrise, icon: <Sun size={18} className="opacity-50" /> },
                  { name: 'Dhuhr', time: prayerTimes.dhuhr, icon: <Sun size={18} /> },
                  { name: 'Asr', time: prayerTimes.asr, icon: <Sun size={18} /> },
                  { name: 'Maghrib', time: prayerTimes.maghrib, icon: <Moon size={18} /> },
                  { name: 'Isha', time: prayerTimes.isha, icon: <Moon size={18} /> },
                ].map((p) => (
                  <div key={p.name} className="bg-white rounded-2xl p-5 flex items-center justify-between border border-zinc-100 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="text-zinc-400">{p.icon}</div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <span className="font-mono text-lg">{format(p.time, 'HH:mm')}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScreenWrapper>
        )}

        {activeScreen === 'calendar' && (
          <ScreenWrapper active={true} key="calendar">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight">Ramadan 2026</h1>
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="grid grid-cols-4 p-4 bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-bottom border-zinc-100">
                  <span>Day</span>
                  <span>Date</span>
                  <span>Sehri</span>
                  <span className="text-right">Iftar</span>
                </div>
                <div className="divide-y divide-zinc-100 max-h-[60vh] overflow-y-auto">
                  {Array.from({ length: 30 }).map((_, i) => {
                    const date = addDays(RAMADAN_START_2026, i);
                    const times = getPrayerTimes(date, location);
                    const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                    return (
                      <div key={i} className={cn(
                        "grid grid-cols-4 p-4 text-sm items-center transition-colors",
                        isToday ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
                      )}>
                        <span className="font-medium">{i + 1}</span>
                        <span className={cn("text-xs", isToday ? "text-zinc-400" : "text-zinc-500")}>{format(date, 'dd MMM')}</span>
                        <span className="font-mono">{format(times.imsak, 'HH:mm')}</span>
                        <span className="font-mono text-right">{format(times.maghrib, 'HH:mm')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScreenWrapper>
        )}

        {activeScreen === 'settings' && (
          <ScreenWrapper active={true} key="settings">
            <div className="space-y-6">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Preferences</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-zinc-400" />
                      <span className="font-medium">Adhan Notifications</span>
                    </div>
                    <button 
                      onClick={() => setAdhanEnabled(!adhanEnabled)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative",
                        adhanEnabled ? "bg-zinc-900" : "bg-zinc-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        adhanEnabled ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 size={18} className="text-zinc-400" />
                      <span className="font-medium">Test Adhan Sound</span>
                    </div>
                    <button 
                      onClick={playAdhan}
                      disabled={isAdhanPlaying}
                      className="text-xs font-bold uppercase tracking-widest text-zinc-900 underline underline-offset-4"
                    >
                      {isAdhanPlaying ? 'Playing...' : 'Play'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Location</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-zinc-400" />
                      <div className="flex flex-col">
                        <span className="font-medium">{location.city}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-zinc-300" />
                  </div>
                </div>

                <div className="p-6 text-center space-y-2">
                  <p className="text-xs text-zinc-400">Ramadan Pro v1.0.0</p>
                  <p className="text-[10px] text-zinc-300 uppercase tracking-widest">Crafted for Mindfulness</p>
                </div>
              </div>
            </div>
          </ScreenWrapper>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-8 py-4 pb-8 flex justify-between items-center">
        <NavButton 
          active={activeScreen === 'home'} 
          onClick={() => setActiveScreen('home')} 
          icon={<Clock size={24} />} 
          label="Home" 
        />
        <NavButton 
          active={activeScreen === 'times'} 
          onClick={() => setActiveScreen('times')} 
          icon={<Sun size={24} />} 
          label="Times" 
        />
        <NavButton 
          active={activeScreen === 'calendar'} 
          onClick={() => setActiveScreen('calendar')} 
          icon={<CalendarIcon size={24} />} 
          label="Calendar" 
        />
        <NavButton 
          active={activeScreen === 'settings'} 
          onClick={() => setActiveScreen('settings')} 
          icon={<SettingsIcon size={24} />} 
          label="Settings" 
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-zinc-900 scale-110" : "text-zinc-300 hover:text-zinc-400"
      )}
    >
      {icon}
      <span className={cn("text-[10px] font-bold uppercase tracking-widest", !active && "hidden")}>{label}</span>
    </button>
  );
}
