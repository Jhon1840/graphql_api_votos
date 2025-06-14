namespace VotingSystem.API.Models
{
    public class ResultadoEleccion
    {
        public string IdCandidato { get; set; } = string.Empty;
        public string NombreCandidato { get; set; } = string.Empty;
        public string Partido { get; set; } = string.Empty;
        public long TotalVotos { get; set; }
    }
} 