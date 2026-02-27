// ** React Imports
import { createContext, useContext, useState, ReactNode } from 'react'

// ** Types
import { CalendarFiltersType, EventType, AddEventType, CalendarStoreType } from 'src/types/apps/calendarTypes'

interface CalendarContextType {
  calendar: CalendarStoreType
  addEvent: (event: AddEventType) => void
  updateEvent: (event: EventType) => void
  deleteEvent: (id: number) => void
  fetchEvents: (calendars: CalendarFiltersType[]) => void
  handleSelectEvent: (event: EventType | null) => void
  handleAllCalendars: (value: boolean) => void
  handleCalendarsUpdate: (calendar: CalendarFiltersType) => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

type Props = {
  children: ReactNode
}

const CalendarProvider = ({ children }: Props) => {
  const [calendar, setCalendar] = useState<CalendarStoreType>({
    events: [],
    selectedCalendars: ['Personal', 'Business', 'Family', 'Holiday', 'ETC'],
    selectedEvent: null
  })

  const addEvent = (event: AddEventType) => {
    const newEvent: EventType = {
      id: Date.now(),
      url: event.url || '',
      title: event.title,
      allDay: event.allDay,
      end: event.end,
      start: event.start,
      extendedProps: event.extendedProps
    }

    setCalendar(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }))
  }

  const updateEvent = (updatedEvent: EventType) => {
    setCalendar(prev => ({
      ...prev,
      events: prev.events.map(event => (event.id === updatedEvent.id ? updatedEvent : event)),
      selectedEvent: prev.selectedEvent?.id === updatedEvent.id ? updatedEvent : prev.selectedEvent
    }))
  }

  const deleteEvent = (id: number) => {
    setCalendar(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== id),
      selectedEvent: prev.selectedEvent?.id === id ? null : prev.selectedEvent
    }))
  }

  const fetchEvents = async (calendars: CalendarFiltersType[]) => {
    try {
      // Mock API call - replace with actual API
      const mockEvents: EventType[] = [
        {
          id: 1,
          url: '',
          title: 'Meeting with client',
          allDay: false,
          end: new Date(Date.now() + 3600000),
          start: new Date(),
          extendedProps: {
            calendar: 'Business',
            description: 'Important client meeting'
          }
        }
      ]

      setCalendar(prev => ({
        ...prev,
        events: mockEvents,
        selectedCalendars: calendars
      }))
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const handleSelectEvent = (event: EventType | null) => {
    setCalendar(prev => ({ ...prev, selectedEvent: event }))
  }

  const handleAllCalendars = (value: boolean) => {
    const allCalendars: CalendarFiltersType[] = ['Personal', 'Business', 'Family', 'Holiday', 'ETC']
    setCalendar(prev => ({
      ...prev,
      selectedCalendars: value ? allCalendars : []
    }))
  }

  const handleCalendarsUpdate = (updatedCalendar: CalendarFiltersType) => {
    setCalendar(prev => ({
      ...prev,
      selectedCalendars: prev.selectedCalendars.includes(updatedCalendar)
        ? prev.selectedCalendars.filter(cal => cal !== updatedCalendar)
        : [...prev.selectedCalendars, updatedCalendar]
    }))
  }

  return (
    <CalendarContext.Provider
      value={{
        calendar,
        addEvent,
        updateEvent,
        deleteEvent,
        fetchEvents,
        handleSelectEvent,
        handleAllCalendars,
        handleCalendarsUpdate
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export const useCalendar = () => {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }

  return context
}

export { CalendarProvider, CalendarContext }
