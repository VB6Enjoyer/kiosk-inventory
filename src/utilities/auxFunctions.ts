export function areObjectsEqual(obj1, obj2) {
    const obj1Props = Object.keys(obj1);
    const obj2Props = Object.keys(obj2);

    if (obj1Props.length !== obj2Props.length) {
        return false;
    }

    for (let prop of obj1Props) {
        if (obj1[prop] !== obj2[prop]) {
            return false;
        }
    }

    return true;
}