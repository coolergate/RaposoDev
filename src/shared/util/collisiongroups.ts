import services from "@rbxts/services";

enum CollisionGroups {
	Default = "Default",
	World = "World",
	Players = "Players",
	Props = "Props",
	Objects = "Objects",
}

if (services.RunService.IsServer()) {
	services.PhysicsService.RegisterCollisionGroup(CollisionGroups.Players);
	services.PhysicsService.RegisterCollisionGroup(CollisionGroups.Props);
	services.PhysicsService.RegisterCollisionGroup(CollisionGroups.World);
	services.PhysicsService.RegisterCollisionGroup(CollisionGroups.Objects);

	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Players, CollisionGroups.Default, true);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Players, CollisionGroups.Objects, false);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Players, CollisionGroups.Players, true);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Players, CollisionGroups.World, true);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Players, CollisionGroups.Props, true);

	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Objects, CollisionGroups.Default, false);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Objects, CollisionGroups.Objects, false);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Objects, CollisionGroups.World, false);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Objects, CollisionGroups.Props, false);

	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Props, CollisionGroups.Default, true);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Props, CollisionGroups.Props, true);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Props, CollisionGroups.World, true);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Props, CollisionGroups.Objects, false);
	services.PhysicsService.CollisionGroupSetCollidable(CollisionGroups.Props, CollisionGroups.Players, false);
}

export = CollisionGroups;
