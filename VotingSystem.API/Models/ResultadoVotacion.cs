namespace VotingSystem.API.Models
{
    public class ResultadoVotacion
    {
        public Guid IdEleccion { get; set; }
        public Guid IdCandidato { get; set; }
        public string NombreCandidato { get; set; } = string.Empty;
        public string Partido { get; set; } = string.Empty;
        public long TotalVotos { get; set; }
    }
} 