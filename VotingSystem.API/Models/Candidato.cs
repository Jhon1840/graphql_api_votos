namespace VotingSystem.API.Models
{
    public class Candidato
    {
        public Guid IdEleccion { get; set; }
        public string IdCandidato { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public string Partido { get; set; } = string.Empty;
    }
}