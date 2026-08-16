import List "mo:core/List";
import ScoresLib "../lib/Scores";
import Types "../types";

mixin (scores : List.List<Types.Score>) {
  /// Save a personal best. Requires a non-anonymous Internet Identity caller.
  public shared ({ caller }) func submitScore(displayName : Text, points : Nat, stage : Nat) : async Types.SubmitResult {
    ScoresLib.submit(scores, caller, displayName, points, stage);
  };

  /// Top scores for the public board. Query — no consensus, cheap on cycles.
  public query func getLeaderboard() : async [Types.Score] {
    ScoresLib.topEntries(scores);
  };

  /// The caller's stored best, if any.
  public query ({ caller }) func getMyScore() : async ?Types.Score {
    if (caller.isAnonymous()) {
      return null;
    };
    ScoresLib.findMine(scores, caller);
  };
};
