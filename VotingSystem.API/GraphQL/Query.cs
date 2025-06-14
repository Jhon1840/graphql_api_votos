using VotingSystem.API.Models;
using VotingSystem.API.Services;
using HotChocolate;
using HotChocolate.Types;

namespace VotingSystem.API.GraphQL
{
    [ObjectType]
    public class Query
    {
        [UsePaging]
        public async Task<List<Eleccion>> Elecciones([Service] CassandraService cassandraService)
        {
            return await cassandraService.GetEleccionesAsync();
        }

        public async Task<Eleccion?> Eleccion(Guid id, [Service] CassandraService cassandraService)
        {
            return await cassandraService.GetEleccionAsync(id);
        }

        [UsePaging]
        public async Task<List<CandidatoInfo>> Candidatos(
            Guid idEleccion,
            [Service] CassandraService cassandraService)
        {
            try
            {
                return await cassandraService.GetCandidatosInfoAsync(idEleccion);
            }
            catch (Exception ex)
            {
                throw new GraphQLException($"Error al obtener candidatos: {ex.Message}");
            }
        }

        public async Task<Votante?> Votante(
            string carnet,
            [Service] CassandraService cassandraService)
        {
            try
            {
                return await cassandraService.GetVotanteAsync(carnet);
            }
            catch (Exception ex)
            {
                throw new GraphQLException($"Error al obtener votante: {ex.Message}");
            }
        }

        [UsePaging]
        public async Task<List<ResultadoVotacion>> ResultadosVotacion(
            Guid idEleccion, 
            [Service] CassandraService cassandraService)
        {
            try
            {
                var resultados = await cassandraService.GetResultadosAsync(idEleccion);
                var candidatos = await cassandraService.GetCandidatosPorEleccionAsync(idEleccion);

                return resultados.Select(r => new ResultadoVotacion
                {
                    IdEleccion = r.IdEleccion,
                    IdCandidato = r.IdCandidato,
                    NombreCandidato = candidatos.FirstOrDefault(c => c.IdCandidato == r.IdCandidato)?.Nombre ?? "Desconocido",
                    Partido = candidatos.FirstOrDefault(c => c.IdCandidato == r.IdCandidato)?.Partido ?? "Desconocido",
                    TotalVotos = r.TotalVotos
                }).ToList();
            }
            catch (Exception ex)
            {
                throw new GraphQLException($"Error al obtener resultados: {ex.Message}");
            }
        }

        public async Task<EstadisticasVotantes> EstadisticasVotantes(
            [Service] CassandraService cassandraService)
        {
            try
            {
                return await cassandraService.GetEstadisticasVotantesAsync();
            }
            catch (Exception ex)
            {
                throw new GraphQLException($"Error al obtener estadísticas de votantes: {ex.Message}");
            }
        }
    }
}