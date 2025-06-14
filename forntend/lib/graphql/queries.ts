import { gql } from "@apollo/client"

export const GET_ELECCIONES = gql`
  query GetElecciones {
    elecciones {
      id
      nombre
      fecha
      estado
    }
  }
`

export const GET_ELECCION = gql`
  query GetEleccion($id: UUID!) {
    eleccion(id: $id) {
      id
      nombre
      fecha
      estado
    }
  }
`

export const GET_CANDIDATOS = gql`
  query GetCandidatos($idEleccion: UUID!) {
    candidatos(idEleccion: $idEleccion) {
      edges {
        node {
          idCandidato
          nombre
          partido
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_VOTANTE = gql`
  query GetVotante($carnet: String!) {
    votante(carnet: $carnet) {
      carnet
      nombre
      haVotado
    }
  }
`

export const GET_RESULTADOS = gql`
  query GetResultados($idEleccion: UUID!) {
    resultadosVotacion(idEleccion: $idEleccion) {
      edges {
        node {
          idCandidato
          nombreCandidato
          partido
          totalVotos
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_ESTADISTICAS = gql`
  query GetEstadisticas {
    estadisticasVotantes {
      totalVotantes
      votantesQueVotaron
      porcentajeParticipacion
    }
  }
`

export const GET_RESULTADOS_VOTACION = gql`
  query GetResultadosVotacion($idEleccion: UUID!) {
    resultadosVotacion(idEleccion: $idEleccion) {
      edges {
        node {
          idCandidato
          nombreCandidato
          partido
          totalVotos
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

export const GET_CANDIDATOS_POR_ELECCION = gql`
  query GetCandidatosPorEleccion($idEleccion: UUID!) {
    candidatosPorEleccion(idEleccion: $idEleccion) {
      edges {
        node {
          idCandidato
          nombre
          partido
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`