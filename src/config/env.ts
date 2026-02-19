export enum NodeEnv {
  Development = "development",
  Production = "production",
}

export const isProduction = process.env.NODE_ENV === NodeEnv.Production;
