using VotingSystem.API.Services;
using VotingSystem.API.Models;
using HotChocolate;
using HotChocolate.Types;
using Microsoft.Extensions.Logging;

namespace VotingSystem.API.GraphQL
{
    [ObjectType]
    public class Mutation
    {
        private readonly ILogger<Mutation> _logger;

        public Mutation(ILogger<Mutation> logger)
        {
            _logger = logger;
        }

        public async Task<Guid> RegistrarEleccion(
            string nombre,
            string fecha,
            string estado,
            [Service] CassandraService cassandraService)
        {
            try
            {
                _logger.LogInformation("Intentando registrar elección con datos: nombre={Nombre}, fecha={Fecha}, estado={Estado}", 
                    nombre, fecha, estado);

                if (string.IsNullOrWhiteSpace(nombre))
                {
                    _logger.LogWarning("Nombre de elección vacío");
                    throw new GraphQLException("El nombre de la elección no puede estar vacío");
                }

                if (string.IsNullOrWhiteSpace(estado))
                {
                    _logger.LogWarning("Estado de elección vacío");
                    throw new GraphQLException("El estado de la elección no puede estar vacío");
                }

                // Parse the ISO date string to DateTime
                _logger.LogInformation("Intentando parsear fecha: {Fecha}", fecha);
                if (!DateTime.TryParse(fecha, out DateTime fechaEleccion))
                {
                    _logger.LogWarning("Formato de fecha inválido: {Fecha}", fecha);
                    throw new GraphQLException($"Formato de fecha inválido: {fecha}. Use formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)");
                }

                _logger.LogInformation("Fecha parseada: {FechaParseada}, UTC: {FechaUTC}, UTC actual: {UtcNow}", 
                    fechaEleccion.ToString("o"), 
                    fechaEleccion.ToUniversalTime().ToString("o"),
                    DateTime.UtcNow.ToString("o"));

                if (fechaEleccion <= DateTime.UtcNow)
                {
                    _logger.LogWarning("Fecha de elección en el pasado o presente: {Fecha}, UTC actual: {UtcNow}", 
                        fechaEleccion.ToString("o"), DateTime.UtcNow.ToString("o"));
                    throw new GraphQLException("La fecha de la elección debe ser futura");
                }

                // Generar un nuevo GUID único para la elección
                var idEleccion = Guid.NewGuid();
                _logger.LogInformation("ID de elección generado: {IdEleccion}", idEleccion);
                
                // Intentar registrar la elección
                var resultado = await cassandraService.RegistrarEleccionAsync(idEleccion, nombre, fechaEleccion, estado);
                if (!resultado)
                {
                    _logger.LogError("Error al registrar la elección en la base de datos");
                    throw new GraphQLException("No se pudo registrar la elección en la base de datos");
                }

                _logger.LogInformation("Elección registrada exitosamente con ID: {IdEleccion}", idEleccion);
                return idEleccion;
            }
            catch (GraphQLException)
            {
                throw; // Re-lanzar excepciones GraphQL sin modificar
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al registrar elección");
                throw new GraphQLException($"Error al registrar la elección: {ex.Message}");
            }
        }

        public async Task<bool> RegistrarCandidato(
            Guid idEleccion,
            string nombre,
            string partido,
            [Service] CassandraService cassandraService)
        {
            try
            {
                _logger.LogInformation("Intentando registrar candidato: elección={IdEleccion}, nombre={Nombre}, partido={Partido}", 
                    idEleccion, nombre, partido);

                if (string.IsNullOrWhiteSpace(nombre))
                {
                    _logger.LogWarning("Nombre de candidato vacío");
                    throw new GraphQLException("El nombre del candidato no puede estar vacío");
                }

                if (string.IsNullOrWhiteSpace(partido))
                {
                    _logger.LogWarning("Partido de candidato vacío");
                    throw new GraphQLException("El partido del candidato no puede estar vacío");
                }

                // Verify that the election exists
                var eleccion = await cassandraService.GetEleccionAsync(idEleccion);
                if (eleccion == null)
                {
                    _logger.LogWarning("Elección no encontrada: {IdEleccion}", idEleccion);
                    throw new GraphQLException($"La elección con ID {idEleccion} no existe");
                }

                // Generar un nuevo GUID para el candidato
                var idCandidato = Guid.NewGuid();
                _logger.LogInformation("ID de candidato generado: {IdCandidato}", idCandidato);

                var resultado = await cassandraService.RegistrarCandidatoAsync(idEleccion, idCandidato, nombre, partido);
                
                if (!resultado)
                {
                    _logger.LogError("Error al registrar el candidato en la base de datos");
                    throw new GraphQLException("No se pudo registrar el candidato en la base de datos");
                }

                _logger.LogInformation("Candidato registrado exitosamente");
                return true;
            }
            catch (GraphQLException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al registrar candidato");
                throw new GraphQLException($"Error al registrar el candidato: {ex.Message}");
            }
        }

        public async Task<bool> RegistrarVotante(
            string carnet,
            string nombre,
            [Service] CassandraService cassandraService)
        {
            try
            {
                return await cassandraService.RegistrarVotanteAsync(carnet, nombre);
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> Votar(
            Guid idEleccion, 
            string carnet, 
            Guid idCandidato, 
            [Service] CassandraService cassandraService)
        {
            try
            {
                _logger.LogInformation("Intentando registrar voto para elección: {IdEleccion}, carnet: {Carnet}, candidato: {IdCandidato}", 
                    idEleccion, carnet, idCandidato);

                // Verificar que el votante existe y no ha votado
                var votante = await cassandraService.GetVotanteAsync(carnet);
                if (votante == null)
                {
                    _logger.LogWarning("Votante no encontrado: {Carnet}", carnet);
                    throw new GraphQLException($"El votante con carnet {carnet} no existe");
                }
                
                if (votante.HaVotado)
                {
                    _logger.LogWarning("Votante ya ha votado: {Carnet}", carnet);
                    throw new GraphQLException($"El votante con carnet {carnet} ya ha votado");
                }

                // Verificar que la elección existe y está activa
                var eleccion = await cassandraService.GetEleccionAsync(idEleccion);
                if (eleccion == null)
                {
                    _logger.LogWarning("Elección no encontrada: {IdEleccion}", idEleccion);
                    throw new GraphQLException($"La elección con ID {idEleccion} no existe");
                }

                if (eleccion.Estado.ToLower() != "activa")
                {
                    _logger.LogWarning("Elección no está activa: {IdEleccion}, estado: {Estado}", idEleccion, eleccion.Estado);
                    throw new GraphQLException($"La elección no está activa (estado actual: {eleccion.Estado})");
                }

                // Verificar que el candidato existe en la elección
                var candidatos = await cassandraService.GetCandidatosPorEleccionAsync(idEleccion);
                if (!candidatos.Any(c => c.IdCandidato == idCandidato))
                {
                    _logger.LogWarning("Candidato no encontrado en la elección: {IdCandidato}, elección: {IdEleccion}", 
                        idCandidato, idEleccion);
                    throw new GraphQLException($"El candidato no existe en esta elección");
                }

                var resultado = await cassandraService.RegistrarVotoAsync(idEleccion, carnet, idCandidato);
                if (!resultado)
                {
                    _logger.LogError("Error al registrar el voto en la base de datos");
                    throw new GraphQLException("Error al registrar el voto en la base de datos");
                }

                _logger.LogInformation("Voto registrado exitosamente");
                return true;
            }
            catch (GraphQLException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado al registrar voto");
                throw new GraphQLException($"Error al registrar el voto: {ex.Message}");
            }
        }

        public async Task<List<ResultadoEleccion>> ObtenerResultados(
            Guid idEleccion,
            [Service] CassandraService cassandraService)
        {
            try
            {
                // Obtener los resultados de votos
                var votosPorCandidato = await cassandraService.GetResultadosAsync(idEleccion);
                
                // Obtener la información de los candidatos
                var candidatos = await cassandraService.GetCandidatosPorEleccionAsync(idEleccion);
                
                // Combinar la información
                var resultados = new List<ResultadoEleccion>();
                foreach (var candidato in candidatos)
                {
                    var votos = votosPorCandidato.FirstOrDefault(v => v.IdCandidato == candidato.IdCandidato);
                    resultados.Add(new ResultadoEleccion
                    {
                        IdCandidato = candidato.IdCandidato,
                        NombreCandidato = candidato.Nombre,
                        Partido = candidato.Partido,
                        TotalVotos = votos?.TotalVotos ?? 0
                    });
                }
                
                return resultados.OrderByDescending(r => r.TotalVotos).ToList();
            }
            catch
            {
                return new List<ResultadoEleccion>();
            }
        }
    }
}