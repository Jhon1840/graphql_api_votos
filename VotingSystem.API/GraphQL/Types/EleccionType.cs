using VotingSystem.API.Models;

namespace VotingSystem.API.GraphQL.Types
{
    public class EleccionType : ObjectType<Eleccion>
    {
        protected override void Configure(IObjectTypeDescriptor<Eleccion> descriptor)
        {
            descriptor.Description("Representa una elección en el sistema");
            
            descriptor
                .Field(e => e.Id)
                .Description("Identificador único de la elección");
            
            descriptor
                .Field(e => e.Nombre)
                .Description("Nombre de la elección");
            
            descriptor
                .Field(e => e.Fecha)
                .Description("Fecha de la elección");
            
            descriptor
                .Field(e => e.Estado)
                .Description("Estado actual de la elección (activa, cerrada, etc.)");
        }
    }
}