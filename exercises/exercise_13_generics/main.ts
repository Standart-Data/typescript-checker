function hasOwnProperty<O extends object, P extends PropertyKey>(
    obj: O,
    prop: P
): obj is O & Record<P, unknown> {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}