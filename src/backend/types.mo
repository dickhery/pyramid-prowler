module {
  public type Score = {
    owner : Principal;
    displayName : Text;
    points : Nat;
    stage : Nat;
    recordedAt : Int;
  };

  public type SubmitError = {
    #anonymous;
    #nameInvalid;
    #notHighEnough;
    #zeroScore;
  };

  public type SubmitResult = {
    #ok : Score;
    #err : SubmitError;
  };
};
