"use client"

import { useState, useCallback } from "react"
import { useMutation, useLazyQuery } from "@apollo/client"
import { VOTAR } from "@/lib/graphql/mutations"
import { GET_RESULTADOS_VOTACION, GET_VOTANTE } from "@/lib/graphql/queries"
import { formatearUUID, esUUIDValido } from "@/lib/utils/uuid"

interface ResultadoVotacion {
  idCandidato: string
  nombreCandidato: string
  partido: string
  totalVotos: number
}

interface Votante {
  carnet: string
  nombre: string
  haVotado: boolean
}

export function useVotacion() {
  const [resultados, setResultados] = useState<ResultadoVotacion[]>([])
  const [loading, setLoading] = useState(false)
  const [votante, setVotante] = useState<Votante | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [votarMutation] = useMutation(VOTAR)
  const [getResultados] = useLazyQuery(GET_RESULTADOS_VOTACION)
  const [getVotante] = useLazyQuery(GET_VOTANTE)

  const votar = async (idEleccion: string, carnet: string, idCandidato: string) => {
    setLoading(true)
    setError(null)
    try {
      if (!esUUIDValido(idEleccion)) {
        setError("ID de elección inválido")
        return { success: false, message: "❌ ID de elección inválido" }
      }

      const idEleccionFormateado = formatearUUID(idEleccion)
      console.log("Votando con ID formateado:", idEleccionFormateado) // Debug log

      const { data } = await votarMutation({
        variables: {
          idEleccion: idEleccionFormateado,
          carnet,
          idCandidato,
        },
      })

      if (data?.votar === true) {
        // Refetch para obtener los resultados actualizados
        await obtenerResultados(idEleccion)
        // Actualizar el estado del votante
        await obtenerVotante(carnet)
        return { success: true, message: "✅ Voto registrado exitosamente" }
      } else {
        setError("Error al registrar el voto")
        return { success: false, message: "❌ Error al registrar el voto" }
      }
    } catch (error: any) {
      console.error("Error registrando voto:", error)
      const errorMessage = error?.graphQLErrors?.[0]?.message || "Error al registrar el voto"
      setError(errorMessage)
      return { success: false, message: `❌ ${errorMessage}` }
    } finally {
      setLoading(false)
    }
  }

  const obtenerResultados = useCallback(async (idEleccion: string) => {
    try {
      setError(null)
      if (!esUUIDValido(idEleccion)) {
        const errorMsg = "ID de elección inválido: " + idEleccion
        console.error(errorMsg)
        setError(errorMsg)
        return
      }

      const idEleccionFormateado = formatearUUID(idEleccion)
      console.log("Obteniendo resultados con ID formateado:", idEleccionFormateado) // Debug log
      console.log("ID original:", idEleccion) // Debug log
      console.log("Es UUID válido:", esUUIDValido(idEleccion)) // Debug log

      const { data } = await getResultados({
        variables: { idEleccion: idEleccionFormateado },
      })

      if (data?.resultadosVotacion?.edges) {
        const resultadosAPI = data.resultadosVotacion.edges.map((edge: any) => ({
          idCandidato: edge.node.idCandidato,
          nombreCandidato: edge.node.nombreCandidato,
          partido: edge.node.partido,
          totalVotos: edge.node.totalVotos,
        }))

        setResultados(resultadosAPI)
      } else {
        console.log("No se encontraron resultados para la elección:", idEleccionFormateado) // Debug log
        setResultados([])
      }
    } catch (error: any) {
      console.error("Error obteniendo resultados:", error)
      const errorMessage = error?.graphQLErrors?.[0]?.message || "Error al obtener resultados"
      setError(errorMessage)
      setResultados([])
    }
  }, [getResultados])

  const obtenerVotante = async (carnet: string) => {
    try {
      setError(null)
      const { data } = await getVotante({
        variables: { carnet },
      })

      if (data?.votante) {
        setVotante(data.votante)
      } else {
        setVotante(null)
      }
    } catch (error: any) {
      console.error("Error obteniendo votante:", error)
      const errorMessage = error?.graphQLErrors?.[0]?.message || "Error al obtener votante"
      setError(errorMessage)
      setVotante(null)
    }
  }

  return {
    resultados,
    loading,
    votante,
    error,
    votar,
    obtenerResultados,
    obtenerVotante,
  }
}
