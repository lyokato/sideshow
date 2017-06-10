
export interface Config {
  socketEndpoint:          string;
  fetchEndpoint:           string;
  directRTCUseMediaServer: boolean,
  logLevel:                number;
};

declare var config: Config;

export default config;
