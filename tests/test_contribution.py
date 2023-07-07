from __future__ import annotations
import ape
import pytest

# def test_authorization(contribution, owner, not_owner):
#     contribution.set_owner(sender=owner)
#     assert owner == contribution.owner()
# 
#     with ape.reverts("!authorized"):
#         contribution.authorized_method(sender=not_owner)
# 
# 

def test_properties(contribution: ape.Contract, owner: ape.Account, receiver: ape.Account):
    assert owner == contribution.owner()
    assert receiver == contribution.beneficiary()