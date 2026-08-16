import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Entity "mo:caffeineai-oql/Entity";
import Expose "mo:caffeineai-oql/Expose";
import TextValue "mo:caffeineai-oql/TextValue";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // Expose the access-control state as a queryable OQL entity so the platform
  // Data Intelligence agent can answer questions about it. The game itself is
  // session-only (no persisted game data), so this is the only queryable state.
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
