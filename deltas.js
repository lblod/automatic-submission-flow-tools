/**
 * @module deltas
 * @description Filter delta messages from the delta-notifier.
 */

import * as N3 from 'n3';
const { namedNode } = N3.DataFactory;

/**
 * Get subjects after filtering the delta messages on a predicate and object.
 *
 * @public
 * @async
 * @function
 * @param {array(object)} deltas - The delta messages used to filter through. The datastructure is the typical delta message format with inserts, deletes, and arrays with objects with s-p-o properties.
 * @param {namedNode} predicate - Filter the deltas where the predicate matches this predicate.
 * @param {namedNode} object - Filter the deltas where the object matches this object.
 * @returns {array(namedNode)} An array of namedNodes representing the filtered results that are always IRIs.
 */
export async function getSubjects(deltas, predicate, object) {
  const filtered = deltas
    .map((changeset) => changeset.inserts)
    .filter((inserts) => inserts.length > 0)
    .flat()
    .filter((insert) => insert.predicate.value === predicate.value)
    .filter((insert) => insert.object.value === object.value)
    .map((insert) => namedNode(insert.subject.value));
  return filtered;
}
