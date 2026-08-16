import List "mo:core/List";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types";

module {
  public let maxName : Nat = 16;
  public let minName : Nat = 2;
  public let maxStored : Nat = 50;
  public let topCount : Nat = 20;

  func isNameChar(c : Char) : Bool {
    (c >= 'A' and c <= 'Z') or (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == ' ' or c == '-' or c == '_';
  };

  /// Trim and accept 2–16 letters, digits, space, hyphen, or underscore.
  public func parseName(raw : Text) : ?Text {
    let trimmed = raw.trim(#text " ");
    let n = trimmed.size();
    if (n < minName or n > maxName) {
      return null;
    };
    for (c in trimmed.toIter()) {
      if (not isNameChar(c)) {
        return null;
      };
    };
    ?trimmed;
  };

  public func compareScores(a : Types.Score, b : Types.Score) : { #less; #equal; #greater } {
    if (a.points > b.points) { #less } else if (a.points < b.points) {
      #greater;
    } else if (a.recordedAt > b.recordedAt) {
      #less;
    } else if (a.recordedAt < b.recordedAt) {
      #greater;
    } else { #equal };
  };

  public func topEntries(scores : List.List<Types.Score>) : [Types.Score] {
    scores.toArray().sort(compareScores).values().take(topCount).toArray();
  };

  public func findMine(scores : List.List<Types.Score>, owner : Principal) : ?Types.Score {
    scores.find(func(entry : Types.Score) : Bool { Principal.equal(entry.owner, owner) });
  };

  func worst(snapshot : [Types.Score]) : Types.Score {
    var lowest = snapshot[0];
    for (entry in snapshot.values()) {
      if (entry.points < lowest.points) {
        lowest := entry;
      } else if (entry.points == lowest.points and entry.recordedAt < lowest.recordedAt) {
        lowest := entry;
      };
    };
    lowest;
  };

  public func submit(
    scores : List.List<Types.Score>,
    owner : Principal,
    displayName : Text,
    points : Nat,
    stage : Nat,
  ) : Types.SubmitResult {
    if (owner.isAnonymous()) {
      return #err(#anonymous);
    };
    if (points == 0) {
      return #err(#zeroScore);
    };
    let name = parseName(displayName) ?? {
      return #err(#nameInvalid);
    };
    let now = Time.now();
    let next : Types.Score = {
      owner;
      displayName = name;
      points;
      stage;
      recordedAt = now;
    };
    let snapshot = scores.toArray();
    let existing = snapshot.find(func(entry : Types.Score) : Bool { Principal.equal(entry.owner, owner) });
    switch (existing) {
      case (?old) {
        if (points < old.points) {
          return #err(#notHighEnough);
        };
        scores.clear();
        for (entry in snapshot.values()) {
          if (Principal.equal(entry.owner, owner)) {
            scores.add(next);
          } else {
            scores.add(entry);
          };
        };
        #ok(next);
      };
      case null {
        if (snapshot.size() < maxStored) {
          scores.add(next);
          return #ok(next);
        };
        let low = worst(snapshot);
        if (points <= low.points) {
          return #err(#notHighEnough);
        };
        scores.clear();
        for (entry in snapshot.values()) {
          if (not Principal.equal(entry.owner, low.owner)) {
            scores.add(entry);
          };
        };
        scores.add(next);
        #ok(next);
      };
    };
  };
};
