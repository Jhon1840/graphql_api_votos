import { gql } from "@apollo/client"

export const REGISTRAR_ELECCION = gql`
  mutation RegistrarEleccion($nombre: String!, $fecha: String!, $estado: String!) {
    registrarEleccion(nombre: $nombre, fecha: $fecha, estado: $estado)
  }
`

export const REGISTRAR_CANDIDATO = gql`
  mutation RegistrarCandidato($idEleccion: UUID!, $nombre: String!, $partido: String!) {
    registrarCandidato(idEleccion: $idEleccion, nombre: $nombre, partido: $partido)
  }
`

export const REGISTRAR_VOTANTE = gql`
  mutation RegistrarVotante($carnet: String!, $nombre: String!) {
    registrarVotante(carnet: $carnet, nombre: $nombre)
  }
`

export const VOTAR = gql`
  mutation Votar($idEleccion: UUID!, $carnet: String!, $idCandidato: UUID!) {
    votar(idEleccion: $idEleccion, carnet: $carnet, idCandidato: $idCandidato)
  }
`
