namespace VotingSystem.API.Models
{
    public class VotoDetalle
    {
        public Guid IdEleccion { get; set; }
        public string Carnet { get; set; } = string.Empty;
        public Guid IdCandidato { get; set; }
        public DateTime FechaVoto { get; set; }
    }

    public class VotoPorCandidato
    {
        public Guid IdEleccion { get; set; }
        public Guid IdCandidato { get; set; }
        public long TotalVotos { get; set; }
    }
}   