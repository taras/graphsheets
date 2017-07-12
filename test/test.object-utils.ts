import * as assert from "power-assert";
import * as jest from "jest-mock";
import {
  mapObject,
  filterObject,
  reduceObject
} from "../lib/utils/object-utils";

describe("utils/object-utils", () => {
  describe("mapObject", () => {
    const original = { first: 1, second: 2 };

    describe("callback use", () => {
      beforeEach(() => {
        this.callback = jest.fn();
        this.result = mapObject(original, this.callback);
      });

      it("was called twice", () => {
        assert.equal(this.callback.mock.calls.length, 2);
      });

      it("was called with key and value", () => {
        assert.deepEqual(this.callback.mock.calls[0], ["first", 1]);
        assert.deepEqual(this.callback.mock.calls[1], ["second", 2]);
      });
    });

    beforeEach(() => {
      this.result = mapObject(original, (key, value) => value * 2);
    });

    it("returns a new object", () => {
      assert.notEqual(original, this.result);
    });

    it("returns a hash with result of the callback", () => {
      assert.deepEqual(this.result, { first: 2, second: 4 });
    });
  });

  describe("filterObject", () => {
    let original = { small: 1, smallish: 2, big: 4 };

    describe("callback use", () => {
      beforeEach(() => {
        this.callback = jest
          .fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(undefined);
        this.result = filterObject(original, this.callback);
      });
      it("was called three times", () => {
        assert.equal(this.callback.mock.calls.length, 3);
      });
      it("removed items that returned false", () => {
        assert.deepEqual(this.result, { smallish: 2 });
      });
      it("passed key and value", () => {
        assert.deepEqual(this.callback.mock.calls[0], ["small", 1]);
        assert.deepEqual(this.callback.mock.calls[1], ["smallish", 2]);
        assert.deepEqual(this.callback.mock.calls[2], ["big", 4]);
      });
    });

    beforeEach(() => {
      this.result = filterObject(
        original,
        (key, value) => key.indexOf("small") === -1
      );
    });

    it("returns a new object", () => {
      assert.notEqual(this.result, original);
    });

    it("returns filtered hash", () => {
      assert.deepEqual(this.result, { big: 4 });
    });
  });

  describe("reduceObject", () => {
    let original = { small: 1, smallish: 2, big: 4 };

    describe("callback use", () => {
      beforeEach(() => {
        this.callback = jest
          .fn()
          .mockReturnValueOnce({ SMALL: 10 })
          .mockReturnValueOnce({ SMALL: 10, SMALLISH: 20 })
          .mockReturnValueOnce({ SMALL: 10, SMALLISH: 20, BIG: 40 });
        this.result = reduceObject(original, this.callback);
      });
      it("was called three times", () => {
        assert.equal(this.callback.mock.calls.length, 3);
      });
      it("returned the last return value", () => {
        assert.deepEqual(this.result, { SMALL: 10, SMALLISH: 20, BIG: 40 });
      });
      it("was invoked with expected arguments", () => {
        assert.deepEqual(this.callback.mock.calls[0], [{}, "small", 1]);
        assert.deepEqual(this.callback.mock.calls[1], [
          { SMALL: 10 },
          "smallish",
          2
        ]);
        assert.deepEqual(this.callback.mock.calls[2], [
          { SMALL: 10, SMALLISH: 20 },
          "big",
          4
        ]);
      });
    });

    beforeEach(() => {
      this.result = reduceObject(original, (result, key, value) => {
        return Object.assign(result, {
          [key.toUpperCase()]: value * 10
        });
      });
    });

    it("returned a new object", () => {
      assert.notEqual(this.result, original);
    });

    it("returned expected result", () => {
      assert.deepEqual(this.result, {
        SMALL: 10,
        SMALLISH: 20,
        BIG: 40
      });
    });
  });
});
