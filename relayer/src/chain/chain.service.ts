import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { RelayConfigService } from '../config/relay-config.service';

@Injectable()
export class ChainService implements OnModuleInit {
  private readonly logger = new Logger(ChainService.name);
  private graphqlClient: SuiGraphQLClient | null = null;
  private keypair: Ed25519Keypair | null = null;

  constructor(private readonly config: RelayConfigService) {}

  onModuleInit() {
    try {
      const privateKey = this.config.getPrivateKey();
      this.keypair = Ed25519Keypair.fromSecretKey(privateKey);
      this.logger.log('Keypair initialized');

      const network = this.config.getNetwork();

      // Use GraphQL endpoint for event querying
      const graphqlUrl = this.getGraphQLUrl(network);
      if (!graphqlUrl) {
        throw new Error(`No GraphQL URL configured for network: ${network}`);
      }

      this.graphqlClient = new SuiGraphQLClient({
        url: graphqlUrl,
        network,
      });

      this.logger.log(`Connected to Sui ${network} network`);
    } catch (error) {
      this.logger.error('Failed to initialize chain service', error);
      throw error;
    }
  }

  private getGraphQLUrl(network: string): string {
    const graphqlUrls: Record<string, string> = {
      testnet: 'https://graphql.testnet.sui.io/graphql',
      mainnet: 'https://graphql.mainnet.sui.io/graphql',
      devnet: 'https://graphql.devnet.sui.io/graphql',
    };
    return graphqlUrls[network] || '';
  }

  public getClient(): SuiGraphQLClient {
    if (!this.graphqlClient) {
      throw new Error('GraphQL client not initialized');
    }
    return this.graphqlClient;
  }

  public getKeypair(): Ed25519Keypair {
    if (!this.keypair) {
      throw new Error('Keypair not initialized');
    }
    return this.keypair;
  }

  async queryEventsPaginated(query: {
    module: string;
    eventType: string;
    limit: number;
    cursor?: string;
  }) {
    if (!this.graphqlClient) {
      throw new Error('GraphQL client not initialized');
    }
    const client = this.graphqlClient;
    const packageId = this.config.getCowDexPackageId();
    const eventType = `${packageId}::${query.module}::${query.eventType}`;

    const graphqlQuery = `
      query QueryEvents($type: String, $first: Int, $after: String) {
        events(filter: { type: $type }, first: $first, after: $after) {
          nodes {
            transactionModule {
              package { address }
              name
            }
            sender { address }
            timestamp
            eventBcs
            transaction { digest }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    try {
      const response = await client.query({
        query: graphqlQuery,
        variables: {
          type: eventType,
          first: query.limit,
          after: query.cursor || null,
        },
      });
      this.logger.debug(
        `Queried events with type ${eventType}, limit ${query.limit}, cursor ${query.cursor}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const eventData = response.data as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const events = eventData?.events?.nodes || [];

      if (events.length > 0) {
        this.logger.debug(
          `First event structure: ${JSON.stringify(Object.keys(events[0]))}`,
        );
        this.logger.debug(`First event data: ${JSON.stringify(events[0])}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const nextCursor = eventData?.events?.pageInfo?.endCursor;

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        data: events.map((event: any, index: number) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const txDigest = (event.transaction?.digest as string) || '';
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const eventBcs = (event.eventBcs as string) || '';
          return {
            id: `${txDigest}_${index}`,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            owner: (event.sender?.address as string) || '',
            // Placeholder values - will be extracted from eventBcs in scanner
            sellAmount: 0n,
            minAmountOut: 0n,
            deadline: 0n,
            txDigest,
            eventSeq: index,
            eventBcs,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            timestamp: parseInt(event.timestamp as string) || Date.now(),
          };
        }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nextCursor,
      };
    } catch (error) {
      this.logger.error('Failed to query events', error);
      throw error;
    }
  }
}
