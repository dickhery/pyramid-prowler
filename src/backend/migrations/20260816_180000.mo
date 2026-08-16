import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type Score = {
    owner : Principal;
    displayName : Text;
    points : Nat;
    stage : Nat;
    recordedAt : Int;
  };

  type OldActor = {
    accessControlState : AccessControlState;
  };

  type NewActor = {
    accessControlState : AccessControlState;
    scores : List.List<Score>;
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      scores = List.empty();
    };
  };
};
