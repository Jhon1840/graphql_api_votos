namespace VotingSystem.API.Models
{
    public class VotoDetalle
    {
        public Guid IdEleccion { get; set; }
        public string Carnet { get; set; } = string.Empty;
        public string IdCandidato { get; set; } = string.Empty;
        public DateTime FechaVoto { get; set; }
    }

    public class VotoPorCandidato
    {
        public Guid IdEleccion { get; set; }
        public string IdCandidato { get; set; } = string.Empty;
        public long TotalVotos { get; set; }
    }
}   