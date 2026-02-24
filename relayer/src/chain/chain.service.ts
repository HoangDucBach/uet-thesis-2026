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
      const rpcUrl = this.config.getRpcUrl();

      if (!rpcUrl) {
        throw new Error(`No RPC URL configured for network: ${network}`);
      }

      this.graphqlClient = new SuiGraphQLClient({
        url: rpcUrl,
        network,
      });

      this.logger.log(`Connected to Sui ${network} network`);
    } catch (error) {
      this.logger.error('Failed to initialize chain service', error);
      throw error;
    }
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
            type
            sender { address }
            timestamp
            data
            transactionDigest
            eventSeq
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const eventData = response.data as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const events = eventData?.events?.nodes || [];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const nextCursor = eventData?.events?.pageInfo?.endCursor;

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        data: events.map((event: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          id: event.eventSeq,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          txDigest: event.transactionDigest,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          eventSeq: event.eventSeq,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
          timestamp: parseInt(event.timestamp) || Date.now(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          ...event.data,
        })),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        nextCursor,
      };
    } catch (error) {
      this.logger.error('Failed to query events', error);
      throw error;
    }
  }
}
