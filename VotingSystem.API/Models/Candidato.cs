namespace VotingSystem.API.Models
{
    public class Candidato
    {
        public Guid IdEleccion { get; set; }
        public Guid IdCandidato { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Partido { get; set; } = string.Empty;
    }
}