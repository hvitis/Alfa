"""One STEP per booklet step (cadgen needs each model declared at module level)."""
from cadgen import step
from lib.steps import cad_step


@step(out="../tmp/steps/step_00.step")
def step_00():
    return cad_step(0)


@step(out="../tmp/steps/step_01.step")
def step_01():
    return cad_step(1)


@step(out="../tmp/steps/step_02.step")
def step_02():
    return cad_step(2)


@step(out="../tmp/steps/step_03.step")
def step_03():
    return cad_step(3)


@step(out="../tmp/steps/step_04.step")
def step_04():
    return cad_step(4)


@step(out="../tmp/steps/step_05.step")
def step_05():
    return cad_step(5)


@step(out="../tmp/steps/step_06.step")
def step_06():
    return cad_step(6)


@step(out="../tmp/steps/step_07.step")
def step_07():
    return cad_step(7)


@step(out="../tmp/steps/step_08.step")
def step_08():
    return cad_step(8)


@step(out="../tmp/steps/step_09.step")
def step_09():
    return cad_step(9)


@step(out="../tmp/steps/step_10.step")
def step_10():
    return cad_step(10)


@step(out="../tmp/steps/step_11.step")
def step_11():
    return cad_step(11)


@step(out="../tmp/steps/step_12.step")
def step_12():
    return cad_step(12)


@step(out="../tmp/steps/step_13.step")
def step_13():
    return cad_step(13)


if __name__ == "__main__":
    for n in range(14):
        globals()[f"step_{n:02d}"]()
