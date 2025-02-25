import { AnimationClip, AnimationMixer, Vector2, Vector3 } from 'three'

import { AnimationManager } from '../AnimationManager'
import { AvatarSettings } from '../AvatarControllerSystem'
import { AvatarComponentType } from '../components/AvatarComponent'
import { AnimationGraph } from './AnimationGraph'
import { LocomotionState, SingleAnimationState } from './AnimationState'
import {
  AnimationTimeTransitionRule,
  BooleanTransitionRule,
  CompositeTransitionRule,
  VectorLengthTransitionRule
} from './AnimationStateTransitionsRule'
import { BlendSpace1D } from './BlendSpace1D'
import { DistanceMatchingAction } from './DistanceMatchingAction'
import { AvatarAnimations, AvatarStates } from './Util'

const getAnimationAction = (name: string, mixer: AnimationMixer) => {
  const clip = AnimationClip.findByName(AnimationManager.instance._animations, name)
  return mixer.clipAction(clip)
}

const getDistanceAction = (animationName: string, mixer: AnimationMixer): DistanceMatchingAction => {
  return new DistanceMatchingAction(
    getAnimationAction(animationName, mixer),
    AnimationManager.instance._rootAnimationData[animationName].distanceTrack
  )
}

/** Class to hold the animation graph for player entity. Every avatar entity will have their saperate graph. */
export class AvatarAnimationGraph extends AnimationGraph {
  initialize(mixer: AnimationMixer, velocity: Vector3, avatar: AvatarComponentType) {
    if (!mixer) return

    // Initialize all the states
    // Locomotion

    const walkForwardAction = getDistanceAction(AvatarAnimations.WALK_FORWARD_ROOT, mixer),
      runForwardAction = getDistanceAction(AvatarAnimations.RUN_FORWARD_ROOT, mixer),
      walkBackwardAction = getDistanceAction(AvatarAnimations.WALK_BACKWARD_ROOT, mixer),
      runBackwardAction = getDistanceAction(AvatarAnimations.RUN_BACKWARD_ROOT, mixer),
      walkLeftAction = getDistanceAction(AvatarAnimations.WALK_STRAFE_LEFT_ROOT, mixer),
      runLeftAction = getDistanceAction(AvatarAnimations.RUN_STRAFE_LEFT_ROOT, mixer),
      walkRightAction = getDistanceAction(AvatarAnimations.WALK_STRAFE_RIGHT_ROOT, mixer),
      runRightAction = getDistanceAction(AvatarAnimations.RUN_STRAFE_RIGHT_ROOT, mixer)

    const locomotionState = new LocomotionState()
    locomotionState.movementParams = { velocity }
    locomotionState.idleAction = getAnimationAction(AvatarAnimations.IDLE, mixer)
    locomotionState.forwardMovementActions.push(
      walkForwardAction,
      runForwardAction,
      walkBackwardAction,
      runBackwardAction
    )

    locomotionState.sideMovementActions.push(walkLeftAction, runLeftAction, walkRightAction, runRightAction)

    const verticalBlendSpace = new BlendSpace1D()
    locomotionState.yAxisBlendSpace = verticalBlendSpace
    verticalBlendSpace.minValue = -AvatarSettings.instance.runSpeed
    verticalBlendSpace.maxValue = AvatarSettings.instance.runSpeed
    verticalBlendSpace.addNode(locomotionState.idleAction, 0)
    verticalBlendSpace.addNode(walkForwardAction.action, AvatarSettings.instance.walkSpeed, walkForwardAction)
    verticalBlendSpace.addNode(runForwardAction.action, AvatarSettings.instance.runSpeed, runForwardAction)
    // TODO: Set the actual root animation speeds for backward movements
    verticalBlendSpace.addNode(walkBackwardAction.action, -AvatarSettings.instance.walkSpeed, walkBackwardAction)
    verticalBlendSpace.addNode(runBackwardAction.action, -AvatarSettings.instance.runSpeed, runBackwardAction)
    const horizontalBlendSpace = new BlendSpace1D()
    locomotionState.xAxisBlendSpace = horizontalBlendSpace
    horizontalBlendSpace.minValue = -AvatarSettings.instance.runSpeed
    horizontalBlendSpace.maxValue = AvatarSettings.instance.runSpeed
    horizontalBlendSpace.addNode(locomotionState.idleAction, 0)
    horizontalBlendSpace.addNode(runLeftAction.action, -AvatarSettings.instance.runSpeed, runLeftAction)
    horizontalBlendSpace.addNode(walkLeftAction.action, -AvatarSettings.instance.walkSpeed, walkLeftAction)
    horizontalBlendSpace.addNode(walkRightAction.action, AvatarSettings.instance.walkSpeed, walkRightAction)
    horizontalBlendSpace.addNode(runRightAction.action, AvatarSettings.instance.runSpeed, runRightAction)

    // Jump

    const jumpState = new SingleAnimationState(AvatarStates.JUMP, false, true)
    jumpState.action = getAnimationAction(AvatarAnimations.JUMP, mixer)

    // Emotes

    const clapState = new SingleAnimationState(AvatarStates.CLAP, false, true)
    clapState.action = getAnimationAction(AvatarAnimations.CLAP, mixer)

    const cryState = new SingleAnimationState(AvatarStates.CRY, false, true)
    cryState.action = getAnimationAction(AvatarAnimations.CRY, mixer)

    const kissState = new SingleAnimationState(AvatarStates.KISS, false, true)
    kissState.action = getAnimationAction(AvatarAnimations.KISS, mixer)

    const waveState = new SingleAnimationState(AvatarStates.WAVE, false, true)
    waveState.action = getAnimationAction(AvatarAnimations.WAVE, mixer)

    const laughState = new SingleAnimationState(AvatarStates.LAUGH, false, true)
    laughState.action = getAnimationAction(AvatarAnimations.LAUGH, mixer)

    const defeatState = new SingleAnimationState(AvatarStates.DEFEAT, false, true)
    defeatState.action = getAnimationAction(AvatarAnimations.DEFEAT, mixer)

    const dance1State = new SingleAnimationState(AvatarStates.DANCE1, true)
    dance1State.action = getAnimationAction(AvatarAnimations.DANCING_1, mixer)

    const dance2State = new SingleAnimationState(AvatarStates.DANCE2, true)
    dance2State.action = getAnimationAction(AvatarAnimations.DANCING_2, mixer)

    const dance3State = new SingleAnimationState(AvatarStates.DANCE3, true)
    dance3State.action = getAnimationAction(AvatarAnimations.DANCING_3, mixer)

    const dance4State = new SingleAnimationState(AvatarStates.DANCE4, true)
    dance4State.action = getAnimationAction(AvatarAnimations.DANCING_4, mixer)

    // Add states to the graph
    this.states[AvatarStates.LOCOMOTION] = locomotionState
    this.states[AvatarStates.JUMP] = jumpState
    this.states[AvatarStates.CLAP] = clapState
    this.states[AvatarStates.CRY] = cryState
    this.states[AvatarStates.KISS] = kissState
    this.states[AvatarStates.WAVE] = waveState
    this.states[AvatarStates.LAUGH] = laughState
    this.states[AvatarStates.DEFEAT] = defeatState
    this.states[AvatarStates.DANCE1] = dance1State
    this.states[AvatarStates.DANCE2] = dance2State
    this.states[AvatarStates.DANCE3] = dance3State
    this.states[AvatarStates.DANCE4] = dance4State

    // Transition rules

    const movementTransitionRule = new VectorLengthTransitionRule(locomotionState.name, velocity)

    this.transitionRules[AvatarStates.LOCOMOTION] = [
      new BooleanTransitionRule(jumpState.name, avatar, 'isGrounded', true)
    ]
    this.transitionRules[AvatarStates.JUMP] = [
      new CompositeTransitionRule(
        locomotionState.name,
        'and',
        new BooleanTransitionRule(locomotionState.name, avatar, 'isGrounded'),
        new AnimationTimeTransitionRule(locomotionState.name, jumpState.action, 0.9)
      )
    ]

    this.transitionRules[AvatarStates.CLAP] = [
      new CompositeTransitionRule(
        locomotionState.name,
        'or',
        movementTransitionRule,
        new AnimationTimeTransitionRule('', clapState.action, 0.9)
      )
    ]
    this.transitionRules[AvatarStates.CRY] = [
      new CompositeTransitionRule(
        locomotionState.name,
        'or',
        movementTransitionRule,
        new AnimationTimeTransitionRule('', cryState.action, 0.9)
      )
    ]
    this.transitionRules[AvatarStates.KISS] = [
      new CompositeTransitionRule(
        locomotionState.name,
        'or',
        movementTransitionRule,
        new AnimationTimeTransitionRule('', kissState.action, 0.9)
      )
    ]
    this.transitionRules[AvatarStates.WAVE] = [
      new CompositeTransitionRule(
        locomotionState.name,
        'or',
        movementTransitionRule,
        new AnimationTimeTransitionRule('', waveState.action, 0.9)
      )
    ]
    this.transitionRules[AvatarStates.LAUGH] = [
      new CompositeTransitionRule(
        locomotionState.name,
        'or',
        movementTransitionRule,
        new AnimationTimeTransitionRule('', laughState.action, 0.9)
      )
    ]
    this.transitionRules[AvatarStates.DEFEAT] = [
      new CompositeTransitionRule(
        locomotionState.name,
        'or',
        movementTransitionRule,
        new AnimationTimeTransitionRule('', defeatState.action, 0.9)
      )
    ]

    this.transitionRules[AvatarStates.DANCE1] = [movementTransitionRule]
    this.transitionRules[AvatarStates.DANCE2] = [movementTransitionRule]
    this.transitionRules[AvatarStates.DANCE3] = [movementTransitionRule]
    this.transitionRules[AvatarStates.DANCE4] = [movementTransitionRule]

    this.currentState = locomotionState
    this.currentState.enter()
  }
}
