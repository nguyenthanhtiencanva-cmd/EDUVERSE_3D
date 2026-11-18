const DEADZONE = 0.12;

// Keep the movement reference fixed during one gesture. Otherwise following
// the character with the camera makes a held strafe key steer in circles.
export function movementHeading(player, cameraYaw, forward, right, lookingAround) {
  if (Math.hypot(forward, right) <= DEADZONE) {
    player.movementActive = false;
    return null;
  }
  if (!player.movementActive || lookingAround) player.movementYaw = cameraYaw;
  player.movementActive = true;
  return player.movementYaw + Math.atan2(-right, forward);
}

// Preserve the stair travel direction when the same gesture continues onto a floor.
// In particular, held S must not reverse again after the camera turns to follow it.
export function rebaseMovementHeading(player, heading, forward, right) {
  player.movementActive = Math.hypot(forward, right) > DEADZONE;
  player.movementYaw = heading - Math.atan2(-right, forward);
}

export function followHeading(cameraYaw, facing, dt, lookingAround = false) {
  if (lookingAround) return cameraYaw;
  const difference = Math.atan2(Math.sin(facing - cameraYaw), Math.cos(facing - cameraYaw));
  return cameraYaw + difference * (1 - Math.exp(-8 * Math.min(dt, 0.05)));
}

// Progress advances only while the user holds a key or pushes the joystick.
export function manualStairProgress(progress, forward, dt, running = false) {
  if (Math.abs(forward) <= DEADZONE) return progress;
  const strength = Math.min(1, (Math.abs(forward) - DEADZONE) / (1 - DEADZONE));
  return Math.max(0, Math.min(1,
    progress + Math.sign(forward) * strength * (running ? 0.04 : 0.03) * Math.min(dt, 0.05),
  ));
}

export function manualStairStep(progress, forward, dt, running = false) {
  const nextProgress = manualStairProgress(progress, forward, dt, running);
  const exitLevel = forward < -DEADZONE && nextProgress === 0
    ? 'ground'
    : forward > DEADZONE && nextProgress === 1
      ? 'balcony'
      : null;
  return { progress: nextProgress, exitLevel };
}
