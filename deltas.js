/**
 * @module deltas
 * @description Filter delta messages from the delta-notifier.
 */

import * as uti from './utils.js';

/**
 * Get subjects after filtering the delta messages on a predicate and object.
 *
 * @public
 * @function
 * @param {array(object)} deltas - The delta messages used to filter through. The datastructure is the typical delta message format with inserts, deletes, and arrays with objects with s-p-o properties.
 * @param {namedNode} predicate - Filter the deltas where the predicate matches this predicate.
 * @param {namedNode} object - Filter the deltas where the object matches this object.
 * @returns {array(namedNode)} An array of namedNodes representing the filtered results that are always IRIs.
 */
export function getSubjects(deltas, predicate, object) {
  const filtered = deltas
    .map((changeset) => changeset.inserts)
    .filter((inserts) => inserts.length > 0)
    .flat()
    .filter((insert) => insert.predicate.value === predicate.value)
    .filter((insert) => insert.object.value === object.value)
    .map((insert) => uti.parseSparqlJsonTerm(insert.subject));
  return filtered;
}

/**
 * Get subjects after filtering the delta messages with the help of subject, predicate and object 'predicate' functions.
 *
 * @public
 * @function
 * @param {array(object)} deltas - The delta messages used to filter through. The datastructure is the typical delta message format with inserts, deletes, and arrays with objects with s-p-o properties.
 * @param {namedNode} subjectPredicate - Include the deltas where the predicate returns a truthy value for this function when passed the subject of a triple.
 * @param {namedNode} predicatePredicate - Include the deltas where the predicate returns a truthy value for this function when passed the predicate of a triple.
 * @param {namedNode} objectPredicate - Include the deltas where the predicate returns a truthy value for this function when passed the object of a triple.
 * @returns {array(namedNode)} An array of namedNodes representing the filtered results that are always IRIs.
 */
export function getSubjectsWithFunctions(
  deltas,
  subjectPredicate,
  predicatePredicate,
  objectPredicate
) {
  const filtered = deltas
    .map((changeset) => changeset.inserts)
    .filter((inserts) => inserts.length > 0)
    .flat()
    .filter(subjectPredicate)
    .filter(predicatePredicate)
    .filter(objectPredicate)
    .map((insert) => uti.parseSparqlJsonTerm(insert.subject));
  return filtered;
}

/**
 * Get triples after filtering the delta messages with the help of subject, predicate and object 'predicate' functions.
 *
 * @public
 * @function
 * @param {array(object)} deltas - The delta messages used to filter through. The datastructure is the typical delta message format with inserts, deletes, and arrays with objects with s-p-o properties.
 * @param {namedNode} subjectPredicate - Include the deltas where the predicate returns a truthy value for this function when passed the subject of a triple.
 * @param {namedNode} predicatePredicate - Include the deltas where the predicate returns a truthy value for this function when passed the predicate of a triple.
 * @param {namedNode} objectPredicate - Include the deltas where the predicate returns a truthy value for this function when passed the object of a triple.
 * @returns {array(quad)} An array of quads representing the filtered data as triples.
 */
export function getTriplesWithFunctions(
  deltas,
  subjectPredicate,
  predicatePredicate,
  objectPredicate
) {
  const filtered = deltas
    .map((changeset) => changeset.inserts)
    .filter((inserts) => inserts.length > 0)
    .flat()
    .filter(subjectPredicate)
    .filter(predicatePredicate)
    .filter(objectPredicate)
    .map(uti.parseSparqlJsonBindingQuad);
  return filtered;
}
