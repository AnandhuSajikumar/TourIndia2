/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const StateContext = createContext(null)

export function StateProvider({ children }) {
  const [states, setStates] = useState([])
  const [selected, setSelected] = useState(() => localStorage.getItem('selectedState') || 'Jharkhand')

  useEffect(() => {
    fetch('/api/states').then((r) => r.json()).then((d) => setStates(d.states))
  }, [])

  useEffect(() => {
    localStorage.setItem('selectedState', selected)
  }, [selected])

  const value = useMemo(() => ({ states, selected, setSelected }), [states, selected])
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export function useTourismState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useTourismState must be used within StateProvider')
  return ctx
}


