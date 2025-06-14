"use client"

import { useState } from "react"
import { useMutation, useLazyQuery } from "@apollo/client"
import { REGISTRAR_CANDIDATO } from "@/lib/graphql/mutations"
import { GET_CANDIDATOS } from "@/lib/graphql/queries"
import { formatearUUID, esUUIDValido } from "@/lib/utils/uuid"

interface Candidato {
  idCandidato: string
  idEleccion: string
  nombre: string
  partido: string
}

export function useCandidatos() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [loading, setLoading] = useState(false)

  const [registrarCandidatoMutation] = useMutation(REGISTRAR_CANDIDATO)
  const [getCandidatos] = useLazyQuery(GET_CANDIDATOS)

  const registrarCandidato = async (idEleccion: string, nombre: string, partido: string) => {
    setLoading(true)
    try {
      // Validar y formatear el UUID
      if (!esUUIDValido(idEleccion)) {
        console.error("ID de elección inválido:", idEleccion)
        return { success: false, message: "❌ ID de elección inválido" }
      }

      const idEleccionFormateado = formatearUUID(idEleccion)
      console.log("Registrando candidato:", {
        idEleccionOriginal: idEleccion,
        idEleccionFormateado,
        esUUIDValido: esUUIDValido(idEleccion),
        nombre,
        partido
      })

      const { data } = await registrarCandidatoMutation({
        variables: {
          idEleccion: idEleccionFormateado,
          nombre,
          partido,
        },
      })

      if (data?.registrarCandidato === true) {
        // Refetch para obtener los datos actualizados
        await obtenerCandidatosPorEleccion(idEleccion)
        return { success: true, message: "✅ Candidato registrado exitosamente" }
      } else {
        console.error("Error en la respuesta del servidor:", data)
        return { success: false, message: "❌ Error al registrar el candidato" }
      }
    } catch (error: any) {
      console.error("Error registrando candidato:", error)
      const errorMessage = error?.graphQLErrors?.[0]?.message || "Error al registrar el candidato"
      return { success: false, message: `❌ ${errorMessage}` }
    } finally {
      setLoading(false)
    }
  }

  const obtenerCandidatosPorEleccion = async (idEleccion: string) => {
    try {
      if (!esUUIDValido(idEleccion)) {
        console.error("ID de elección inválido:", idEleccion)
        return
      }

      const idEleccionFormateado = formatearUUID(idEleccion)
      console.log("Obteniendo candidatos con ID formateado:", idEleccionFormateado) // Debug log

      const { data } = await getCandidatos({
        variables: { idEleccion: idEleccionFormateado },
      })

      if (data?.candidatos?.edges) {
        const candidatosAPI = data.candidatos.edges.map((edge: any) => ({
          idCandidato: edge.node.idCandidato,
          idEleccion,
          nombre: edge.node.nombre,
          partido: edge.node.partido,
        }))

        // Actualizar solo los candidatos de esta elección
        setCandidatos((prev) => [...prev.filter((c) => c.idEleccion !== idEleccion), ...candidatosAPI])
      }
    } catch (error) {
      console.error("Error obteniendo candidatos:", error)
    }
  }

  return {
    candidatos,
    loading,
    registrarCandidato,
    obtenerCandidatosPorEleccion,
  }
}
