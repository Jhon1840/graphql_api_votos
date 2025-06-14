namespace VotingSystem.API.Models
{
    public class Eleccion
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
        public string Estado { get; set; } = string.Empty;
    }
}