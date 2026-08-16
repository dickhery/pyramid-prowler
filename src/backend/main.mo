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
