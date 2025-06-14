"use client"

import { useState } from "react"
import { useMutation, useLazyQuery } from "@apollo/client"
import { REGISTRAR_VOTANTE } from "@/lib/graphql/mutations"
import { GET_VOTANTE } from "@/lib/graphql/queries"

interface Votante {
  carnet: string
  nombre: string
  haVotado: boolean
}

export function useVotantes() {
  const [votantes, setVotantes] = useState<Votante[]>([])
  const [loading, setLoading] = useState(false)

  const [registrarVotanteMutation] = useMutation(REGISTRAR_VOTANTE)
  const [getVotante] = useLazyQuery(GET_VOTANTE)

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
        // Agregar el nuevo votante al estado local
        const nuevoVotante: Votante = {
          carnet,
          nombre,
          haVotado: false,
        }

        setVotantes((prev) => [...prev, nuevoVotante])
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
  }

  return {
    votantes,
    loading,
    registrarVotante,
    verificarVotante,
    marcarComoVotado,
  }
}
