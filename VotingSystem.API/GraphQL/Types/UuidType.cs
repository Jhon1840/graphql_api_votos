using HotChocolate.Types;
using HotChocolate.Language;
using System;

namespace VotingSystem.API.GraphQL.Types
{
    public class UuidType : ScalarType<Guid, StringValueNode>
    {
        public UuidType() : base("UUID")
        {
            Description = "UUID custom scalar type";
        }

        protected override bool IsInstanceOfType(StringValueNode literal)
        {
            return Guid.TryParse(literal.Value, out _);
        }

        protected override Guid ParseLiteral(StringValueNode literal)
        {
            if (Guid.TryParse(literal.Value, out Guid parsedGuid))
            {
                return parsedGuid;
            }
            throw new ArgumentException("Invalid UUID format", nameof(literal));
        }

        protected override StringValueNode ParseValue(Guid value)
        {
            return new StringValueNode(value.ToString("D"));
        }

        public override IValueNode ParseResult(object? resultValue)
        {
            if (resultValue is null)
            {
                return NullValueNode.Default;
            }

            if (resultValue is string stringValue)
            {
                if (Guid.TryParse(stringValue, out Guid parsedGuid))
                {
                    return new StringValueNode(parsedGuid.ToString("D"));
                }
                throw new ArgumentException("Invalid UUID format", nameof(resultValue));
            }

            if (resultValue is Guid guidValue)
            {
                return new StringValueNode(guidValue.ToString("D"));
            }

            throw new ArgumentException("Invalid UUID format", nameof(resultValue));
        }
    }
} 