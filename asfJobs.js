/**
 * @module asfJobs
 * @description Create and update Jobs in the triplestore, more specifically tailored for the automatic-submission-flow.
 */

import * as cts from './constants.js';
import * as N3 from 'n3';
import * as jbt from './jobs.js';
const { namedNode } = N3.DataFactory;

/**
 * @see {@link module:jobs.create}
 */
export async function create(activity, creator, graph) {
  const operation = namedNode(cts.OPERATIONS.automaticSubmissionFlow);
  const cogsOperation = namedNode(cts.COGS_OPERATION.transformation);
  return jbt.create(operation, activity, creator, cogsOperation, graph);
}

/**
 * @see {@link module:jobs.updateStatus}
 */
export async function updateStatus() {
  return jbt.updateStatus(...arguments);
}

/**
 * @see {@link module:jobs.getStatusFromActivity}
 */
export async function getStatusFromActivity() {
  return jbt.getStatusFromActivity(...arguments);
}
