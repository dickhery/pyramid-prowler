import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Entity "mo:caffeineai-oql/Entity";
import Expose "mo:caffeineai-oql/Expose";
import TextValue "mo:caffeineai-oql/TextValue";
import List "mo:core/List";
import LeaderboardMixin "mixins/Leaderboard";
import Types "types";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let scores : List.List<Types.Score>;

  include MixinAuthorization(accessControlState, null);
  include LeaderboardMixin(scores);

  /// Drop anonymous score writes before Candid decode. Not a security
  /// boundary — submitScore still rejects anonymous callers.
  system func inspect({
    caller : Principal;
    msg : {
      #_initialize_access_control : () -> ();
      #_internet_identity_sign_in_finish : () -> ();
      #_internet_identity_sign_in_start : () -> ();
      #assignCallerUserRole : () -> (user : Principal, role : AccessControl.UserRole);
      #execute : () -> (qJson : Text);
      #getCallerUserRole : () -> ();
      #getLeaderboard : () -> ();
      #getMyScore : () -> ();
      #isCallerAdmin : () -> ();
      #schema : () -> ();
      #submitScore : () -> (displayName : Text, points : Nat, stage : Nat);
    };
  }) : Bool {
    switch (msg) {
      case (#submitScore _) { not caller.isAnonymous() };
      case _ { true };
    };
  };

  // Expose the access-control state as a queryable OQL entity so the platform
  // Data Intelligence agent can answer questions about it.
  include Expose({
    entities = [
      Entity.manual<(Principal, AccessControl.UserRole)>(
        "userRole",
        func () = accessControlState.userRoles.entries(),
        "UserRole",
        "principal",
      )
        .payload("principal", func ((p, _)) = p.toText())
        .payload("role", func ((_, r)) = switch r { case (#admin) "admin"; case (#user) "user"; case (#guest) "guest" })
        .controllerOnly()
        .build(),
    ];
  });
};
