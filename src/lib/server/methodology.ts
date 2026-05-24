import { createServerFn } from "@tanstack/react-start";
import { sql } from "drizzle-orm";
import topicKeywordsJson from "@/data/topic-keywords.json";
import { db } from "@/lib/db";

export type MethodologyData = {
  corpus: {
    totalSessions: number;
    totalSpeeches: number;
    totalMps: number;
    earliestDate: string | null;
    latestDate: string | null;
  };
  embedding: {
    /** Model identifier (e.g. "openai/text-embedding-3-small"). */
    model: string;
    /** Vector dimensionality. */
    dim: number;
    /** Number of speeches with a stored embedding. */
    count: number;
  };
  umap: {
    nNeighbors: number;
    minDist: number;
    /** Number of speeches with a 2D projection. */
    count: number;
  };
  clustering: {
    method: string;
    k: number;
    /** ISO timestamp the cluster JSON was generated. */
    generatedAt: string;
    /** Number of distinct topic IDs currently assigned in DB. */
    activeClusters: number;
  };
  distinctivePhrases: {
    method: string;
    /** Dirichlet prior strength. */
    alpha: number;
    minCount: number;
  };
  links: {
    github: string;
    dataSource: string;
  };
};

type TopicKeywordsFile = {
  generatedAt: string;
  k: number;
  numSpeeches: number;
  clusters: Record<string, unknown>;
};
const TOPIC_KEYWORDS = topicKeywordsJson as TopicKeywordsFile;

const GITHUB_URL = "https://github.com/NoelHuibers/politscope";
const DATA_SOURCE_URL = "https://www.bundestag.de/services/opendata";

/** Aggregate pipeline metadata for the methodology modal. */
export const getMethodology = createServerFn({ method: "GET" }).handler(
  async (): Promise<MethodologyData> => {
    const [row] = (
      await db.execute<{
        total_sessions: string;
        total_speeches: string;
        total_mps: string;
        earliest_date: string | null;
        latest_date: string | null;
        embedding_count: string;
        embedding_model: string | null;
        embedding_dim: number | null;
        umap_count: string;
        cluster_count: string;
      }>(sql`
        SELECT
          (SELECT count(*)::text FROM sessions) AS total_sessions,
          (SELECT count(*)::text FROM speeches) AS total_speeches,
          (SELECT count(*)::text FROM mps) AS total_mps,
          (SELECT min(date)::text FROM sessions) AS earliest_date,
          (SELECT max(date)::text FROM sessions) AS latest_date,
          (SELECT count(*)::text FROM speech_embeddings) AS embedding_count,
          (SELECT model FROM speech_embeddings LIMIT 1) AS embedding_model,
          (SELECT array_length(embedding::real[], 1) FROM speech_embeddings LIMIT 1) AS embedding_dim,
          (SELECT count(*)::text FROM speeches WHERE umap_x IS NOT NULL) AS umap_count,
          (SELECT count(DISTINCT topic_id)::text FROM speeches WHERE topic_id IS NOT NULL) AS cluster_count
      `)
    ).rows;

    return {
      corpus: {
        totalSessions: Number(row?.total_sessions ?? 0),
        totalSpeeches: Number(row?.total_speeches ?? 0),
        totalMps: Number(row?.total_mps ?? 0),
        earliestDate: row?.earliest_date ?? null,
        latestDate: row?.latest_date ?? null,
      },
      embedding: {
        model: row?.embedding_model ?? "openai/text-embedding-3-small",
        dim: row?.embedding_dim ?? 1536,
        count: Number(row?.embedding_count ?? 0),
      },
      umap: {
        nNeighbors: 15,
        minDist: 0.1,
        count: Number(row?.umap_count ?? 0),
      },
      clustering: {
        method: "k-means (kmeans++ init) + c-TF-IDF Keywords",
        k: TOPIC_KEYWORDS.k,
        generatedAt: TOPIC_KEYWORDS.generatedAt,
        activeClusters: Number(row?.cluster_count ?? 0),
      },
      distinctivePhrases: {
        method: "Log-Odds-Ratio mit Dirichlet-Prior (Monroe, Colaresi & Quinn 2008)",
        alpha: 0.5,
        minCount: 3,
      },
      links: {
        github: GITHUB_URL,
        dataSource: DATA_SOURCE_URL,
      },
    };
  },
);
