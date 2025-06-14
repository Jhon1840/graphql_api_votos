using HotChocolate.Types;
using VotingSystem.API.Models;
using VotingSystem.API.Services;

namespace VotingSystem.API.GraphQL
{
    public class CandidatoInfoType : ObjectType<CandidatoInfo>
    {
        protected override void Configure(IObjectTypeDescriptor<CandidatoInfo> descriptor)
        {
            descriptor.Field(c => c.IdCandidato).Type<UuidType>();
            descriptor.Field(c => c.Nombre).Type<NonNullType<StringType>>();
            descriptor.Field(c => c.Partido).Type<NonNullType<StringType>>();
        }
    }

    public class EstadisticasVotantesType : ObjectType<EstadisticasVotantes>
    {
        protected override void Configure(IObjectTypeDescriptor<EstadisticasVotantes> descriptor)
        {
            descriptor.Field(e => e.TotalVotantes).Type<NonNullType<IntType>>();
            descriptor.Field(e => e.VotantesActivos).Type<NonNullType<IntType>>();
            descriptor.Field(e => e.VotantesQueYaVotaron).Type<NonNullType<IntType>>();
            descriptor.Field(e => e.ListaVotantes).Type<ListType<VotanteType>>();
        }
    }

    public class VotanteType : ObjectType<Votante>
    {
        protected override void Configure(IObjectTypeDescriptor<Votante> descriptor)
        {
            descriptor.Field(v => v.Carnet).Type<NonNullType<StringType>>();
            descriptor.Field(v => v.Nombre).Type<NonNullType<StringType>>();
            descriptor.Field(v => v.HaVotado).Type<NonNullType<BooleanType>>();
        }
    }

    public class ResultadoVotacionType : ObjectType<ResultadoVotacion>
    {
        protected override void Configure(IObjectTypeDescriptor<ResultadoVotacion> descriptor)
        {
            descriptor.Field(r => r.IdEleccion).Type<UuidType>();
            descriptor.Field(r => r.IdCandidato).Type<UuidType>();
            descriptor.Field(r => r.NombreCandidato).Type<NonNullType<StringType>>();
            descriptor.Field(r => r.Partido).Type<NonNullType<StringType>>();
            descriptor.Field(r => r.TotalVotos).Type<NonNullType<LongType>>();
        }
    }

    public class EleccionType : ObjectType<Eleccion>
    {
        protected override void Configure(IObjectTypeDescriptor<Eleccion> descriptor)
        {
            descriptor.Field(e => e.Id).Type<UuidType>();
            descriptor.Field(e => e.Nombre).Type<NonNullType<StringType>>();
            descriptor.Field(e => e.Fecha).Type<NonNullType<DateTimeType>>();
            descriptor.Field(e => e.Estado).Type<NonNullType<StringType>>();
        }
    }
} 