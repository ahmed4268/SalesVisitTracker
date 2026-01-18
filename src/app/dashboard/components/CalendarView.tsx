'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

// --- Interfaces ---
interface Appointment {
  id: string;
  visite_id: string;
  date_rdv: string;
  heure_rdv: string;
  objet: string;
  commercial_id: string;
  commercial_name: string;
  entreprise: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  description?: string;
  location?: string;
  attendees?: string[]; // Initials or names
  commercial_name?: string;
}

interface CalendarViewProps {
  currentUserRole: 'commercial' | 'admin' | 'consultant' | null;
  currentUserId: string | null;
}

// --- Constants & Colors ---
const COMMERCIAL_COLORS = [
  '#3182CE', // blue-600 (Primary/Accent)
  '#38A169', // green-600
  '#D69E2E', // yellow-600
  '#805AD5', // purple-600
  '#E53E3E', // red-600
  '#00B5D8', // cyan-500
  '#D53F8C', // pink-600
];

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function CalendarView({ currentUserRole, currentUserId }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State from provided example
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
      const response = await fetch(`/api/rendez-vous?from=${start.toISOString()}&to=${end.toISOString()}`);
      if (!response.ok) return;

      const data = await response.json();
      const rdvList = data.data || [];

      // Enrich & Map to CalendarEvent
      const mappedEvents: CalendarEvent[] = await Promise.all(
        rdvList.map(async (rdv: any) => {
          let visite = null;
          try {
             // Optimisation: We assume minimal need for extra fetch if basic info is present, 
             // but keeping logic for consistency with previous implementations
             const visiteRes = await fetch(`/api/visites?id=${rdv.visite_id}`);
             const visiteData = visiteRes.ok ? await visiteRes.json() : null;
             visite = visiteData?.data?.[0];
          } catch(e) {}

          const company = visite?.entreprise || rdv.entreprise || 'Client';
          const object = rdv.objet || visite?.objet_visite || 'Rendez-vous';
          const commId = visite?.commercial_id || rdv.commercial_id || 'unknown';
          const commName = visite?.commercial_name || rdv.commercial_name || 'Commercial';
          
          // Generate deterministic color based on commercial ID char code sum
          const charCodeSum = commId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          const color = COMMERCIAL_COLORS[charCodeSum % COMMERCIAL_COLORS.length];

          // Parse start/end
          const startDate = new Date(rdv.date_rdv);
          const [hours, mins] = rdv.heure_rdv ? rdv.heure_rdv.split(':') : ['09', '00'];
          startDate.setHours(parseInt(hours), parseInt(mins));
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Assume 1 hour

          return {
            id: rdv.id,
            title: company,
            start: startDate,
            end: endDate,
            color: color,
            description: object,
            location: visite?.ville || '',
            attendees: [commName],
            commercial_name: commName
          };
        })
      );

      setEvents(mappedEvents);
      // Keep raw appointments for reference if needed
      setAppointments(rdvList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(e => e.start >= now)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 4);
  };

  // --- Handlers ---
  const handleEventMouseEnter = (event: CalendarEvent, e: React.MouseEvent) => {
    setHoveredEvent(event.id);
    const rect = e.currentTarget.getBoundingClientRect();
    // Calculate position relative to viewport but adjusted for the card container
    setTooltipPosition({ x: rect.left, y: rect.top - 10 });
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    
    // Empty slots
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/40 rounded-xl border border-transparent"></div>
      );
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      days.push(
        <div
          key={day}
          className={`
            min-h-[100px] p-2 rounded-xl border transition-all duration-300 relative group flex flex-col gap-1
            ${isToday 
              ? 'bg-blue-50/50 border-blue-200' 
              : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
            }
            ${isWeekend && !isToday ? 'bg-slate-50/50' : ''}
          `}
        >
          <div className={`
            w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full mb-1
            ${isToday 
              ? 'bg-blue-600 text-white shadow-sm' 
              : isWeekend ? 'text-slate-400' : 'text-slate-700'
            }
          `}>
            {day}
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto max-h-[80px] scrollbar-none">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                onMouseEnter={(e) => handleEventMouseEnter(event, e)}
                onMouseLeave={() => { setHoveredEvent(null); setTooltipPosition(null); }}
                className="relative pl-2 pr-1 py-1 rounded-md text-[10px] bg-opacity-10 hover:brightness-95 transition-all cursor-default flex items-center gap-1 border-l-2"
                style={{ 
                    backgroundColor: `${event.color}15`,
                    color: '#1e293b', // slate-800
                    borderLeftColor: event.color
                }}
              >
                <div className="font-bold truncate leading-tight flex-1">
                    {event.title}
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-[9px] text-slate-400 font-bold px-1 text-center bg-slate-50 rounded py-0.5">
                +{dayEvents.length - 3} autres
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  const hoveredEventData = hoveredEvent ? events.find(e => e.id === hoveredEvent) : null;
  const upcomingList = getUpcomingEvents();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
      
      {/* 1. Main Calendar Card (8/12 = 66%) */}
      <div className="xl:col-span-8 bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize">
              {MONTH_NAMES[currentDate.getMonth()]} <span className="text-slate-300 mx-1">/</span> {currentDate.getFullYear()}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
                Gérez les rendez-vous de l'équipe commerciale
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="w-9 h-9 flex items-center justify-center bg-white text-slate-600 hover:text-blue-600 rounded-xl shadow-sm border border-slate-200/50 hover:border-blue-100 transition-all duration-200"
            >
              <Icon name="ChevronLeftIcon" size={16} strokeWidth={2.5} />
            </button>
            <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 h-9 flex items-center bg-white text-slate-700 hover:text-blue-600 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm border border-slate-200/50 hover:border-blue-100 transition-all duration-200"
            >
                Aujourd'hui
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="w-9 h-9 flex items-center justify-center bg-white text-slate-600 hover:text-blue-600 rounded-xl shadow-sm border border-slate-200/50 hover:border-blue-100 transition-all duration-200"
            >
              <Icon name="ChevronRightIcon" size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-4 mb-4 px-1">
          {DAY_NAMES.map((day, idx) => (
            <div key={day} className={`text-xs font-bold text-center tracking-widest uppercase ${idx >= 5 ? 'text-amber-400' : 'text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-7 gap-3 auto-rows-fr flex-grow">
          {renderMonthView()}
        </div>
      </div>

      {/* 2. Upcoming Events Panel (4/12 = 33%) */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Card: Prochains RDV */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 flex-grow">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">
                        Agenda
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Prochains événements prévus
                    </p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icon name="CalendarIcon" size={20} />
                </div>
            </div>
            
            <div className="space-y-0 relative">
                {/* Vertical Line */}
                {upcomingList.length > 0 && (
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 rounded-full" />
                )}

                {upcomingList.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3 shadow-sm">
                            <Icon name="CalendarDaysIcon" size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-900">Aucun rendez-vous</p>
                        <p className="text-xs text-slate-500 mt-1">L'agenda est vide pour les jours à venir.</p>
                    </div>
                ) : (
                    upcomingList.map((event, idx) => {
                        const isToday = new Date().toDateString() === event.start.toDateString();
                        
                        return (
                        <div key={event.id} className="relative pl-10 py-3 group">
                            {/* Timeline Dot */}
                            <div 
                                className={`
                                    absolute left-2.5 top-6 w-5 h-5 -ml-2.5 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10
                                    ${isToday ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-slate-200 group-hover:bg-blue-400'}
                                    transition-colors duration-300
                                `}
                            >
                                {isToday && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>

                            {/* Content Card */}
                            <div className="p-4 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-md transition-all duration-300 cursor-default">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {isToday && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
                                                    Auj.
                                                </span>
                                            )}
                                            <span className="text-xs font-bold text-slate-500">
                                                {event.start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                            <span className="text-xs text-slate-300">•</span>
                                            <span className="text-xs font-bold text-slate-900">
                                                {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        
                                        <h4 className="text-sm font-bold text-slate-900 truncate mb-1" title={event.title}>
                                            {event.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                                            <Icon name="MapPinIcon" size={12} className="text-slate-400" />
                                            {event.location || 'Sur place'}
                                        </p>
                                    </div>
                                    
                                    {/* Action Button - Invisible until hover */}
                                    <button className="p-2 rounded-xl bg-white text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:text-blue-600">
                                        <Icon name="EllipsisHorizontalIcon" size={18} />
                                    </button>
                                </div>
                                
                                {/* Commercial Badge */}
                                <div className="mt-3 flex items-center gap-2">
                                    <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                                        style={{ backgroundColor: event.color }}
                                    >
                                        {event.commercial_name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-xs text-slate-600 font-medium truncate max-w-[120px]">
                                        {event.commercial_name}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )})
                )}
            </div>
        </div>

        {/* Mini Stats Card (Optional Filler) */}
        {!loading && upcomingList.length > 0 && (
             <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">Total ce mois</p>
                        <p className="text-3xl font-extrabold">{events.length}</p>
                    </div>
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                        <Icon name="ChartBarIcon" size={20} className="text-white" />
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-blue-100">
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">+12%</span>
                    <span>vs mois dernier</span>
                </div>
             </div>
        )}
      </div>

      {/* Hover Tooltip */}
      {hoveredEventData && tooltipPosition && (
        <div
          className="fixed z-[9999] pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateY(-100%) translateY(-10px)'
          }}
        >
          <div className="bg-slate-900 text-white shadow-2xl rounded-xl p-4 max-w-xs min-w-[200px] border border-slate-700/50">
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-900" style={{ backgroundColor: hoveredEventData.color }} />
                    <span className="font-bold text-xs bg-white/10 px-2 py-0.5 rounded-md">
                        {hoveredEventData.commercial_name}
                    </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                    {hoveredEventData.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
            
            <h4 className="font-bold text-sm text-white mb-1 leading-snug">
                {hoveredEventData.title}
            </h4>
            
            <p className="text-xs text-slate-400 italic line-clamp-2">
              {hoveredEventData.description}
            </p>
            
            {/* Arrow */}
            <div className="absolute top-full left-6 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
}
