using Cassandra;
using VotingSystem.API.Models;
using Microsoft.Extensions.Logging;

namespace VotingSystem.API.Services
{
    public class CassandraService
    {
        private readonly Cassandra.ISession _session;
        private readonly ILogger<CassandraService> _logger;

        public CassandraService(IConfiguration configuration, ILogger<CassandraService> logger)
        {
            _logger = logger;
            try
            {
                var contactPoints = configuration.GetValue<string>("CASSANDRA_CONTACT_POINTS") ?? "localhost:9042";
                _logger.LogInformation($"Intentando conectar a Cassandra en: {contactPoints}");

                var cluster = Cluster.Builder()
                    .AddContactPoints(contactPoints.Split(','))
                    .WithPort(9042)
                    .WithDefaultKeyspace("sistema_votacion")
                    .WithReconnectionPolicy(new ConstantReconnectionPolicy(1000))
                    .WithRetryPolicy(new DefaultRetryPolicy())
                    .WithQueryTimeout(10000)
                    .Build();

                _session = cluster.Connect();
                _logger.LogInformation("Conexión exitosa a Cassandra");

                // Verificar y crear el keyspace si no existe
                var keyspaceExists = _session.Execute("SELECT keyspace_name FROM system_schema.keyspaces WHERE keyspace_name = 'sistema_votacion'").Any();
                if (!keyspaceExists)
                {
                    _logger.LogWarning("El keyspace 'sistema_votacion' no existe. Creándolo...");
                    _session.Execute(@"
                        CREATE KEYSPACE IF NOT EXISTS sistema_votacion
                        WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}");
                    _logger.LogInformation("Keyspace 'sistema_votacion' creado exitosamente");
                }

                _session.ChangeKeyspace("sistema_votacion");

                // Recrear las tablas
                RecrearTablas();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al conectar con Cassandra");
                throw new Exception($"Error al conectar con Cassandra: {ex.Message}", ex);
            }
        }

        private void RecrearTablas()
        {
            try
            {
                // Eliminar tablas existentes si existen
                _session.Execute("DROP TABLE IF EXISTS eleccion");
                _session.Execute("DROP TABLE IF EXISTS candidatos_por_eleccion");
                _session.Execute("DROP TABLE IF EXISTS votantes");
                _session.Execute("DROP TABLE IF EXISTS votos_detalle");
                _session.Execute("DROP TABLE IF EXISTS votos_por_candidato");

                _logger.LogInformation("Tablas existentes eliminadas");

                // Crear tablas con la nueva estructura
                _session.Execute(@"
                    CREATE TABLE eleccion (
                        id UUID PRIMARY KEY,
                        nombre TEXT,
                        fecha BIGINT,
                        estado TEXT
                    )");

                _session.Execute(@"
                    CREATE TABLE candidatos_por_eleccion (
                        id_eleccion UUID,
                        id_candidato UUID,
                        nombre TEXT,
                        partido TEXT,
                        PRIMARY KEY (id_eleccion, id_candidato)
                    )");

                _session.Execute(@"
                    CREATE TABLE votantes (
                        carnet TEXT PRIMARY KEY,
                        nombre TEXT,
                        ha_votado BOOLEAN
                    )");

                _session.Execute(@"
                    CREATE TABLE votos_detalle (
                        id_eleccion UUID,
                        carnet TEXT,
                        id_candidato UUID,
                        fecha_voto BIGINT,
                        PRIMARY KEY (id_eleccion, carnet)
                    )");

                _session.Execute(@"
                    CREATE TABLE votos_por_candidato (
                        id_eleccion UUID,
                        id_candidato UUID,
                        total_votos COUNTER,
                        PRIMARY KEY (id_eleccion, id_candidato)
                    )");

                _logger.LogInformation("Tablas recreadas exitosamente");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al recrear las tablas");
                throw new Exception($"Error al recrear las tablas: {ex.Message}", ex);
            }
        }

        // Elecciones
        public async Task<List<Eleccion>> GetEleccionesAsync()
        {
            try
            {
                _logger.LogInformation("Obteniendo lista de elecciones");
                var statement = new SimpleStatement("SELECT * FROM eleccion");
                var result = await _session.ExecuteAsync(statement);
                
                var elecciones = new List<Eleccion>();
                foreach (var row in result)
                {
                    try
                    {
                        var timestamp = row.GetValue<long>("fecha");
                        var fecha = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).DateTime;
                        
                        var eleccion = new Eleccion
                        {
                            Id = row.GetValue<Guid>("id"),
                            Nombre = row.GetValue<string>("nombre") ?? "",
                            Fecha = fecha,
                            Estado = row.GetValue<string>("estado") ?? ""
                        };
                        elecciones.Add(eleccion);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error al procesar fila de elección: {row}");
                    }
                }
                
                _logger.LogInformation($"Se encontraron {elecciones.Count} elecciones");
                return elecciones;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener elecciones");
                throw new Exception($"Error al obtener elecciones: {ex.Message}", ex);
            }
        }

        public async Task<Eleccion?> GetEleccionAsync(Guid id)
        {
            try
            {
                var statement = new SimpleStatement("SELECT * FROM eleccion WHERE id = ?", id);
                var result = await _session.ExecuteAsync(statement);
                var row = result.FirstOrDefault();
                
                if (row == null) return null;
                
                var timestamp = row.GetValue<long>("fecha");
                var fecha = DateTimeOffset.FromUnixTimeMilliseconds(timestamp).DateTime;
                
                return new Eleccion
                {
                    Id = row.GetValue<Guid>("id"),
                    Nombre = row.GetValue<string>("nombre") ?? "",
                    Fecha = fecha,
                    Estado = row.GetValue<string>("estado") ?? ""
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener elección con ID: {id}");
                throw new Exception($"Error al obtener elección: {ex.Message}", ex);
            }
        }

        // Candidatos
        public async Task<List<Candidato>> GetCandidatosPorEleccionAsync(Guid idEleccion)
        {
            try
            {
                var statement = new SimpleStatement("SELECT * FROM candidatos_por_eleccion WHERE id_eleccion = ?", idEleccion);
                var result = await _session.ExecuteAsync(statement);
                
                return result.Select(row => new Candidato
                {
                    IdEleccion = row.GetValue<Guid>("id_eleccion"),
                    IdCandidato = row.GetValue<Guid>("id_candidato"),
                    Nombre = row.GetValue<string>("nombre") ?? "",
                    Partido = row.GetValue<string>("partido") ?? ""
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener candidatos para elección: {idEleccion}");
                throw new Exception($"Error al obtener candidatos: {ex.Message}", ex);
            }
        }

        // Votantes
        public async Task<Votante?> GetVotanteAsync(string carnet)
        {
            try
            {
                var statement = new SimpleStatement("SELECT * FROM votantes WHERE carnet = ?", carnet);
                var result = await _session.ExecuteAsync(statement);
                var row = result.FirstOrDefault();
                
                if (row == null) return null;
                
                return new Votante
                {
                    Carnet = row.GetValue<string>("carnet") ?? "",
                    Nombre = row.GetValue<string>("nombre") ?? "",
                    HaVotado = row.GetValue<bool>("ha_votado")
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener votante con carnet: {carnet}");
                throw new Exception($"Error al obtener votante: {ex.Message}", ex);
            }
        }

        // Votar
        public async Task<bool> RegistrarVotoAsync(Guid idEleccion, string carnet, Guid idCandidato)
        {
            try
            {
                _logger.LogInformation($"Iniciando registro de voto para elección: {idEleccion}, carnet: {carnet}, candidato: {idCandidato}");

                // Verificar que el votante existe
                var votante = await GetVotanteAsync(carnet);
                if (votante == null)
                {
                    _logger.LogError($"El votante con carnet {carnet} no existe");
                    throw new Exception($"El votante con carnet {carnet} no existe");
                }

                if (votante.HaVotado)
                {
                    _logger.LogError($"El votante con carnet {carnet} ya ha votado");
                    throw new Exception($"El votante con carnet {carnet} ya ha votado");
                }

                // Verificar que la elección existe y está activa
                var eleccion = await GetEleccionAsync(idEleccion);
                if (eleccion == null)
                {
                    _logger.LogError($"La elección con ID {idEleccion} no existe");
                    throw new Exception($"La elección con ID {idEleccion} no existe");
                }

                if (eleccion.Estado.ToLower() != "activa")
                {
                    _logger.LogError($"La elección {idEleccion} no está activa (estado actual: {eleccion.Estado})");
                    throw new Exception($"La elección no está activa (estado actual: {eleccion.Estado})");
                }

                // Verificar que el candidato existe en la elección
                var candidatos = await GetCandidatosPorEleccionAsync(idEleccion);
                if (!candidatos.Any(c => c.IdCandidato == idCandidato))
                {
                    _logger.LogError($"El candidato {idCandidato} no existe en la elección {idEleccion}");
                    throw new Exception($"El candidato no existe en esta elección");
                }

                // Verificar si el votante ya votó en esta elección
                var checkVoto = new SimpleStatement(
                    "SELECT carnet FROM votos_detalle WHERE id_eleccion = ? AND carnet = ?",
                    idEleccion, carnet);
                var votoResult = await _session.ExecuteAsync(checkVoto);
                if (votoResult.Any())
                {
                    _logger.LogError($"El votante {carnet} ya ha votado en la elección {idEleccion}");
                    throw new Exception($"El votante ya ha votado en esta elección");
                }

                try
                {
                    // Batch: Operaciones no-counter (INSERT y UPDATE normales)
                    _logger.LogInformation("Preparando batch de operaciones no-counter");
                    var batchNoCounter = new BatchStatement();
                    
                    // Registrar voto detalle
                    _logger.LogInformation("Agregando operación de registro de voto detalle");
                    batchNoCounter.Add(new SimpleStatement(
                        "INSERT INTO votos_detalle (id_eleccion, carnet, id_candidato, fecha_voto) VALUES (?, ?, ?, ?)",
                        idEleccion, carnet, idCandidato, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()));
                    
                    // Marcar votante como que ya votó
                    _logger.LogInformation("Agregando operación de actualización de estado del votante");
                    batchNoCounter.Add(new SimpleStatement(
                        "UPDATE votantes SET ha_votado = true WHERE carnet = ?", carnet));
                    
                    _logger.LogInformation("Ejecutando batch de operaciones no-counter");
                    await _session.ExecuteAsync(batchNoCounter);

                    // Ejecutar operación counter directamente (sin batch)
                    _logger.LogInformation($"Actualizando contador para candidato {idCandidato} en elección {idEleccion}");
                    var counterStatement = new SimpleStatement(
                        "UPDATE votos_por_candidato SET total_votos = total_votos + 1 WHERE id_eleccion = ? AND id_candidato = ?",
                        idEleccion, idCandidato);
                    await _session.ExecuteAsync(counterStatement);

                    _logger.LogInformation("Voto registrado exitosamente");
                    return true;
                }
                catch (Exception batchEx)
                {
                    _logger.LogError(batchEx, "Error durante la ejecución de las operaciones");
                    if (batchEx.InnerException != null)
                    {
                        _logger.LogError($"Error interno: {batchEx.InnerException.Message}");
                    }
                    throw new Exception($"Error durante el registro del voto: {batchEx.Message}", batchEx);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al registrar voto para elección: {idEleccion}, carnet: {carnet}, candidato: {idCandidato}");
                if (ex.InnerException != null)
                {
                    _logger.LogError($"Error interno: {ex.InnerException.Message}");
                    if (ex.InnerException.InnerException != null)
                    {
                        _logger.LogError($"Error interno anidado: {ex.InnerException.InnerException.Message}");
                    }
                }
                throw new Exception($"Error al registrar el voto: {ex.Message}", ex);
            }
        }

        // Resultados
        public async Task<List<VotoPorCandidato>> GetResultadosAsync(Guid idEleccion)
        {
            try
            {
                var statement = new SimpleStatement("SELECT * FROM votos_por_candidato WHERE id_eleccion = ?", idEleccion);
                var result = await _session.ExecuteAsync(statement);
                
                return result.Select(row => new VotoPorCandidato
                {
                    IdEleccion = row.GetValue<Guid>("id_eleccion"),
                    IdCandidato = row.GetValue<Guid>("id_candidato"),
                    TotalVotos = row.GetValue<long>("total_votos")
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener resultados para elección: {idEleccion}");
                throw new Exception($"Error al obtener resultados: {ex.Message}", ex);
            }
        }

        // Registrar Candidato
        public async Task<bool> RegistrarCandidatoAsync(Guid idEleccion, Guid idCandidato, string nombre, string partido)
        {
            try
            {
                var statement = new SimpleStatement(
                    "INSERT INTO candidatos_por_eleccion (id_eleccion, id_candidato, nombre, partido) VALUES (?, ?, ?, ?)",
                    idEleccion, idCandidato, nombre, partido);
                
                await _session.ExecuteAsync(statement);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al registrar candidato: {nombre} para elección: {idEleccion}");
                return false;
            }
        }

        // Registrar Votante
        public async Task<bool> RegistrarVotanteAsync(string carnet, string nombre)
        {
            try
            {
                var statement = new SimpleStatement(
                    "INSERT INTO votantes (carnet, nombre, ha_votado) VALUES (?, ?, false)",
                    carnet, nombre);
                
                await _session.ExecuteAsync(statement);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al registrar votante con carnet: {carnet}");
                return false;
            }
        }

        // Registrar Elección
        public async Task<bool> RegistrarEleccionAsync(Guid idEleccion, string nombre, DateTime fecha, string estado)
        {
            try
            {
                _logger.LogInformation($"Intentando registrar elección: ID={idEleccion}, Nombre={nombre}, Fecha={fecha}, Estado={estado}");

                // Verificar que la elección no exista ya
                var eleccionExistente = await GetEleccionAsync(idEleccion);
                if (eleccionExistente != null)
                {
                    _logger.LogWarning($"Ya existe una elección con el ID: {idEleccion}");
                    throw new Exception($"Ya existe una elección con el ID: {idEleccion}");
                }

                // Convertir la fecha a timestamp en milisegundos
                var timestamp = new DateTimeOffset(fecha.ToUniversalTime()).ToUnixTimeMilliseconds();

                var statement = new SimpleStatement(
                    "INSERT INTO eleccion (id, nombre, fecha, estado) VALUES (?, ?, ?, ?)",
                    idEleccion, 
                    nombre, 
                    timestamp,  // Usar timestamp en milisegundos
                    estado);
                
                await _session.ExecuteAsync(statement);
                
                // Verificar que la inserción fue exitosa
                var eleccionVerificada = await GetEleccionAsync(idEleccion);
                if (eleccionVerificada == null)
                {
                    _logger.LogError("La elección no se pudo verificar después de la inserción");
                    throw new Exception("Error al verificar la inserción de la elección");
                }

                _logger.LogInformation($"Elección registrada exitosamente: {idEleccion}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error detallado al registrar elección: {ex.Message}");
                if (ex.InnerException != null)
                {
                    _logger.LogError($"Error interno: {ex.InnerException.Message}");
                }
                throw new Exception($"Error al registrar la elección: {ex.Message}", ex);
            }
        }

        // Obtener información detallada de candidatos
        public async Task<List<CandidatoInfo>> GetCandidatosInfoAsync(Guid idEleccion)
        {
            try
            {
                var statement = new SimpleStatement(
                    "SELECT id_candidato, nombre, partido FROM candidatos_por_eleccion WHERE id_eleccion = ?",
                    idEleccion);
                var result = await _session.ExecuteAsync(statement);
                
                return result.Select(row => new CandidatoInfo
                {
                    IdCandidato = row.GetValue<Guid>("id_candidato").ToString(),
                    Nombre = row.GetValue<string>("nombre") ?? "",
                    Partido = row.GetValue<string>("partido") ?? ""
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error al obtener información de candidatos para elección: {idEleccion}");
                throw new Exception($"Error al obtener información de candidatos: {ex.Message}", ex);
            }
        }

        // Obtener estadísticas de votantes
        public async Task<EstadisticasVotantes> GetEstadisticasVotantesAsync()
        {
            try
            {
                var statement = new SimpleStatement("SELECT carnet, nombre, ha_votado FROM votantes");
                var result = await _session.ExecuteAsync(statement);
                
                var votantes = result.Select(row => new Votante
                {
                    Carnet = row.GetValue<string>("carnet") ?? "",
                    Nombre = row.GetValue<string>("nombre") ?? "",
                    HaVotado = row.GetValue<bool>("ha_votado")
                }).ToList();

                return new EstadisticasVotantes
                {
                    TotalVotantes = votantes.Count,
                    VotantesActivos = votantes.Count(v => !v.HaVotado),
                    VotantesQueYaVotaron = votantes.Count(v => v.HaVotado),
                    ListaVotantes = votantes
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener estadísticas de votantes");
                throw new Exception($"Error al obtener estadísticas de votantes: {ex.Message}", ex);
            }
        }
    }

    public class CandidatoInfo
    {
        public string IdCandidato { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Partido { get; set; } = string.Empty;
    }

    public class EstadisticasVotantes
    {
        public int TotalVotantes { get; set; }
        public int VotantesActivos { get; set; }
        public int VotantesQueYaVotaron { get; set; }
        public List<Votante> ListaVotantes { get; set; } = new List<Votante>();
    }
}