"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation, useQuery } from "@apollo/client"
import { REGISTRAR_ELECCION } from "@/lib/graphql/mutations"
import { GET_ELECCIONES } from "@/lib/graphql/queries"
import { formatearUUID, esUUIDValido } from "@/lib/utils/uuid"

interface Eleccion {
  id: string
  nombre: string
  fecha: string
  estado: string
}

export const useElecciones = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, loading: queryLoading, refetch } = useQuery(GET_ELECCIONES)

  const [registrarEleccionMutation] = useMutation(REGISTRAR_ELECCION)

  const registrarEleccion = useCallback(async (nombre: string, fecha: string) => {
    try {
      setLoading(true)
      setError(null)

      // Determinar el estado basado en la fecha
      const fechaEleccion = new Date(fecha)
      const ahora = new Date()
      const estado = fechaEleccion > ahora ? "activa" : "finalizada"

      // Formatear la fecha a UTC ISO string sin milisegundos
      const fechaISO = fechaEleccion.toISOString()
      
      console.log('Datos a enviar:', {
        nombre,
        fecha: fechaISO,
        estado,
        fechaOriginal: fecha,
        fechaEleccion: fechaEleccion.toISOString(),
        fechaLocal: fechaEleccion.toLocaleString(),
        fechaUTC: fechaEleccion.toUTCString()
      })

      const { data: mutationData } = await registrarEleccionMutation({
        variables: {
          nombre,
          fecha: fechaISO,
          estado
        }
      })

      // La mutación devuelve un UUID como string
      const idEleccion = mutationData?.registrarEleccion
      
      if (!idEleccion || !esUUIDValido(idEleccion)) {
        console.error('ID de elección inválido:', idEleccion)
        throw new Error("Error al registrar la elección: ID inválido")
      }

      // Refetch para actualizar la lista de elecciones
      await refetch()
      
      return {
        success: true,
        message: "Elección registrada exitosamente",
        id: formatearUUID(idEleccion)
      }
    } catch (err) {
      console.error("Error registrando elección:", err)
      const mensaje = err instanceof Error ? err.message : "Error al registrar la elección"
      setError(mensaje)
      return {
        success: false,
        message: mensaje
      }
    } finally {
      setLoading(false)
    }
  }, [registrarEleccionMutation, refetch])

  const elecciones = data?.elecciones || []

  return {
    elecciones,
    loading: loading || queryLoading,
    error,
    registrarEleccion
  }
}
