namespace VotingSystem.API.Models
{
    public class Votante
    {
        public string Carnet { get; set; } = string.Empty;
        public string Nombre { get; set; } = string.Empty;
        public bool HaVotado { get; set; }
    }
}