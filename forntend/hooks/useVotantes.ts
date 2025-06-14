"use client"

import { useState, useEffect } from "react"
import { useMutation, useLazyQuery } from "@apollo/client"
import { REGISTRAR_VOTANTE } from "@/lib/graphql/mutations"
import { GET_VOTANTE, GET_ESTADISTICAS_VOTANTES } from "@/lib/graphql/queries"

interface Votante {
  carnet: string
  nombre: string
  haVotado: boolean
}

interface EstadisticasVotantes {
  totalVotantes: number
  votantesActivos: number
  votantesQueYaVotaron: number
  listaVotantes: Votante[]
}

export function useVotantes() {
  const [votantes, setVotantes] = useState<Votante[]>([])
  const [loading, setLoading] = useState(false)
  const [estadisticas, setEstadisticas] = useState<EstadisticasVotantes | null>(null)

  const [registrarVotanteMutation] = useMutation(REGISTRAR_VOTANTE)
  const [getVotante] = useLazyQuery(GET_VOTANTE)
  const [getEstadisticasVotantes] = useLazyQuery(GET_ESTADISTICAS_VOTANTES)

  // Cargar estadísticas y lista de votantes al montar el componente
  useEffect(() => {
    cargarEstadisticasVotantes()
  }, [])

  const cargarEstadisticasVotantes = async () => {
    try {
      const { data } = await getEstadisticasVotantes()
      if (data?.estadisticasVotantes) {
        setEstadisticas(data.estadisticasVotantes)
        setVotantes(data.estadisticasVotantes.listaVotantes)
      }
    } catch (error) {
      console.error("Error cargando estadísticas de votantes:", error)
    }
  }

  const registrarVotante = async (carnet: string, nombre: string) => {
    setLoading(true)
    try {
      const { data } = await registrarVotanteMutation({
        variables: {
          carnet,
          nombre,
        },
      })

      if (data?.registrarVotante) {
        // Recargar estadísticas y lista de votantes
        await cargarEstadisticasVotantes()
        return { success: true, message: "✅ Votante registrado exitosamente" }
      }
      return { success: false, message: "❌ Error al registrar el votante" }
    } catch (error) {
      console.error("Error registrando votante:", error)
      return { success: false, message: "❌ Error al registrar el votante" }
    } finally {
      setLoading(false)
    }
  }

  const verificarVotante = async (carnet: string) => {
    try {
      const { data } = await getVotante({
        variables: { carnet },
      })

      if (data?.votante) {
        // Actualizar el votante en el estado local
        setVotantes((prev) => {
          const votanteExistente = prev.find((v) => v.carnet === carnet)
          if (votanteExistente) {
            return prev.map((v) => (v.carnet === carnet ? { ...v, haVotado: data.votante.haVotado } : v))
          } else {
            return [...prev, data.votante]
          }
        })
        return data.votante
      }
      return null
    } catch (error) {
      console.error("Error verificando votante:", error)
      return null
    }
  }

  const marcarComoVotado = (carnet: string) => {
    setVotantes((prev) =>
      prev.map((v) => (v.carnet === carnet ? { ...v, haVotado: true } : v))
    )
    // Actualizar estadísticas
    if (estadisticas) {
      setEstadisticas({
        ...estadisticas,
        votantesQueYaVotaron: estadisticas.votantesQueYaVotaron + 1,
        votantesActivos: estadisticas.votantesActivos - 1
      })
    }
  }

  return {
    votantes,
    estadisticas,
    loading,
    registrarVotante,
    verificarVotante,
    marcarComoVotado,
    cargarEstadisticasVotantes
  }
}
