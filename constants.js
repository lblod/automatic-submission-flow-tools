export const PREFIX_TABLE = {
  meb: 'http://rdf.myexperiment.org/ontologies/base/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  pav: 'http://purl.org/pav/',
  dct: 'http://purl.org/dc/terms/',
  oslc: 'http://open-services.net/ns/core#',
  melding: 'http://lblod.data.gift/vocabularies/automatische-melding/',
  lblodBesluit: 'http://lblod.data.gift/vocabularies/besluit/',
  besluit: 'http://data.vlaanderen.be/ns/besluit#',
  mandaat: 'http://data.vlaanderen.be/ns/mandaat#',
  adms: 'http://www.w3.org/ns/adms#',
  muAccount: 'http://mu.semte.ch/vocabularies/account/',
  eli: 'http://data.europa.eu/eli/ontology#',
  org: 'http://www.w3.org/ns/org#',
  elod: 'http://linkedeconomy.org/ontology#',
  nie: 'http://www.semanticdesktop.org/ontologies/2007/01/19/nie#',
  prov: 'http://www.w3.org/ns/prov#',
  mu: 'http://mu.semte.ch/vocabularies/core/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  nfo: 'http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  dbpedia: 'http://dbpedia.org/ontology/',
  ext: 'http://mu.semte.ch/vocabularies/ext/',
  http: 'http://www.w3.org/2011/http#',
  rpioHttp: 'http://redpencil.data.gift/vocabularies/http/',
  dgftSec: 'http://lblod.data.gift/vocabularies/security/',
  dgftOauth: 'http://kanselarij.vo.data.gift/vocabularies/oauth-2.0-session/',
  wotSec: 'https://www.w3.org/2019/wot/security#',
  cogs: 'http://vocab.deri.ie/cogs#',
  asj: 'http://data.lblod.info/id/automatic-submission-job/',
  services: 'http://lblod.data.gift/services/',
  job: 'http://lblod.data.gift/jobs/',
  task: 'http://redpencil.data.gift/vocabularies/tasks/',
  js: 'http://redpencil.data.gift/id/concept/JobStatus/',
  tasko: 'http://lblod.data.gift/id/jobs/concept/TaskOperation/',
  jobo: 'http://lblod.data.gift/id/jobs/concept/JobOperation/',
  hrvst: 'http://lblod.data.gift/vocabularies/harvesting/',
  lblodlg: 'http://data.lblod.info/vocabularies/leidinggevenden/',
};

export const GRAPHS = {
  error: 'http://mu.semte.ch/graphs/error',
};

export const PREDICATE_TABLE = {
  adms_status: `${PREFIX_TABLE.adms}status`,
  task_operation: `${PREFIX_TABLE.task}operation`,
};

export const BASE_TABLE = {
  job: PREFIX_TABLE.asj,
  task: PREFIX_TABLE.asj,
  error: 'http://data.lblod.info/errors/',
  resultsContainer: PREFIX_TABLE.asj,
  inputContainer: PREFIX_TABLE.asj,
  harvestingCollection: PREFIX_TABLE.asj,
  remoteDataObject: 'http://data.lblod.info/id/remote-data-objects/',
  file: PREFIX_TABLE.asj,
};

export const DOWNLOAD_STATUSES = {
  scheduled: 'http://lblod.data.gift/file-download-statuses/sheduled',
  ongoing: 'http://lblod.data.gift/file-download-statuses/ongoing',
  success: 'http://lblod.data.gift/file-download-statuses/success',
  failure: 'http://lblod.data.gift/file-download-statuses/failure',
};
export const TASK_STATUSES = {
  scheduled: `${PREFIX_TABLE.js}scheduled`,
  busy: `${PREFIX_TABLE.js}busy`,
  success: `${PREFIX_TABLE.js}success`,
  failed: `${PREFIX_TABLE.js}failed`,
};
export const JOB_STATUSES = {
  busy: `${PREFIX_TABLE.js}busy`,
  success: `${PREFIX_TABLE.js}success`,
  failed: `${PREFIX_TABLE.js}failed`,
};
export const SUBMISSION_STATUSES = {
  concept:
    'http://lblod.data.gift/concepts/79a52da4-f491-4e2f-9374-89a13cde8ecd',
  submittable:
    'http://lblod.data.gift/concepts/f6330856-e261-430f-b949-8e510d20d0ff',
};

export const SERVICES = {
  automaticSubmission: `${PREFIX_TABLE.services}automatic-submission-service`,
  importSubmision: `${PREFIX_TABLE.services}import-submission-service`,
  enrichSubmission: `${PREDICATE_TABLE.services}enrich-submission-service`,
};

export const OPERATIONS = {
  register: `${PREFIX_TABLE.tasko}register`,
  download: `${PREFIX_TABLE.tasko}download`,
  import: `${PREFIX_TABLE.tasko}import`,
  enrich: `${PREFIX_TABLE.tasko}enrich`,
  automaticSubmissionFlow: `${PREFIX_TABLE.jobo}automaticSubmissionFlow`,
};
export const COGS_OPERATIONS = {
  transformation: `${PREFIX_TABLE.cogs}TransformationProcess`,
  webServiceLookup: `${PREFIX_TABLE.cogs}WebServiceLookup`,
};

export const FORMATS = {
  ttl: 'text/turtle',
};

export const TYPES = {
  date: `${PREFIX_TABLE.xsd}date`,
  dateTime: `${PREFIX_TABLE.xsd}dateTime`,
  integer: `${PREFIX_TABLE.xsd}integer`,
};

export const SPARQL_PREFIXES = (() => {
  const all = [];
  for (const key in PREFIX_TABLE)
    all.push(`PREFIX ${key}: <${PREFIX_TABLE[key]}>`);
  return all.join('\n');
})();
